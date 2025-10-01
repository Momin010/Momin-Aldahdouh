import type { Message, Files, FileAttachment, ApiResponse } from '../types';

// The Gemini API logic is now on the server. This function calls our backend proxy.
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

        return await response.json();
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
