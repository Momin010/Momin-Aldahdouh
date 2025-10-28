import type { Message, Files, FileAttachment, ApiResponse } from '../types';
import { contextManager } from './contextManager';


// This function now handles a streaming response from the backend to avoid payload size limits.
export const sendAiChatRequest = async (
    messages: Message[],
    files: Files | null,
    attachments: FileAttachment[] | null,
    signal?: AbortSignal,
    onProgress?: ProgressCallback,
    retryCount: number = 0,
    maxRetries: number = 2,
    useSmartContext: boolean = true
): Promise<ApiResponse> => {
    try {
        // Optimize context if enabled
        let optimizedMessages = messages;
        let optimizedFiles = files;

        if (useSmartContext && files) {
            const contextStats = contextManager.getContextStats(messages, files);
            console.log('Context stats before optimization:', contextStats);

            if (contextStats.compressionNeeded) {
                const optimized = contextManager.optimizeContext(messages, files);
                optimizedMessages = optimized.messages;
                optimizedFiles = optimized.files;
                console.log('Context optimized, compression ratio:', optimized.compressionRatio);
            }
        }

        const response = await fetch('/api/gemini/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ messages: optimizedMessages, files: optimizedFiles, attachments }),
            signal,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'An unknown API error occurred' }));
            throw new Error(errorData.message || `Request failed with status ${response.status}`);
        }

        if (!response.body) {
            throw new Error("The response from the server was empty.");
        }

        // Get total bytes if available
        const contentLength = response.headers.get('content-length');
        const totalBytes = contentLength ? parseInt(contentLength, 10) : undefined;

        // Read the stream from the server
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedJson = '';
        let receivedBytes = 0;

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }

            const chunk = decoder.decode(value, { stream: true });
            accumulatedJson += chunk;
            receivedBytes += value.length;

            // Call progress callback if provided
            if (onProgress) {
                onProgress(receivedBytes, totalBytes);
            }
        }

        // Once the stream is complete, parse the full JSON string.
        try {
            const result = JSON.parse(accumulatedJson);

            // Check if the response looks complete
            if (!result || typeof result !== 'object') {
                throw new Error("Response is not a valid object");
            }

            // For MODIFY_CODE responses, ensure we have both changes and standaloneHtml
            if (result.responseType === 'MODIFY_CODE' && (!result.modification?.changes || !result.modification?.standaloneHtml)) {
                throw new Error("Incomplete MODIFY_CODE response - missing required fields");
            }

            return result;
        } catch (parseError) {
            console.error("Failed to parse streamed JSON from server:", parseError);
            console.error("Received incomplete or malformed content:", accumulatedJson);

            // Check if this was a clean abort (user cancelled)
            if (signal?.aborted) {
                throw new DOMException('Aborted', 'AbortError');
            }

            // If we haven't exceeded max retries and the response seems incomplete, retry
            if (retryCount < maxRetries && accumulatedJson.length > 0) {
                console.log(`Response appears incomplete, retrying... (attempt ${retryCount + 1}/${maxRetries + 1})`);
                // Notify UI about retry
                if (onProgress) {
                    onProgress(0, undefined, true);
                }
                // Wait a bit before retrying
                await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
                return sendAiChatRequest(messages, files, attachments, signal, onProgress, retryCount + 1, maxRetries, useSmartContext);
            }

            throw new Error("Received a malformed or incomplete response from the AI service.");
        }

    } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
            // Re-throw so the UI can handle the abort state
            throw error;
        }
        console.error('Error sending chat request to backend proxy:', error);
        // Re-throw to be handled by the calling component
        throw error;
    }
};

export const resetChat = () => {
    // This service is now stateless, so this function does nothing.
};