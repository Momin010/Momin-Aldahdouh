import type { Message, Files, FileAttachment, ApiResponse } from '../types';

// Progress callback type
type ProgressCallback = (receivedBytes: number, totalBytes?: number) => void;

// This function now handles a streaming response from the backend to avoid payload size limits.
export const sendAiChatRequest = async (
    messages: Message[],
    files: Files | null,
    attachments: FileAttachment[] | null,
    signal?: AbortSignal,
    onProgress?: ProgressCallback
): Promise<ApiResponse> => {
    try {
        const response = await fetch('/api/gemini/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ messages, files, attachments }),
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
            return JSON.parse(accumulatedJson);
        } catch (parseError) {
            console.error("Failed to parse streamed JSON from server:", parseError);
            console.error("Received incomplete or malformed content:", accumulatedJson);
            throw new Error("Received a malformed response from the AI service.");
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