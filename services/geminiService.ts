import type { Message, Files, FileAttachment, ApiResponse } from '../types';

// This function now handles a streaming response from the backend to avoid payload size limits.
export const sendAiChatRequest = async (
    messages: Message[], 
    files: Files | null, 
    attachment: FileAttachment | null,
    signal?: AbortSignal
): Promise<ApiResponse> => {
    try {
        const response = await fetch('/api/gemini/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ messages, files, attachment }),
            signal,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'An unknown API error occurred' }));
            throw new Error(errorData.message || `Request failed with status ${response.status}`);
        }

        if (!response.body) {
            throw new Error("The response from the server was empty.");
        }

        // Read the stream from the server
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedJson = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }
            accumulatedJson += decoder.decode(value, { stream: true });
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