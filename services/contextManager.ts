import type { Message, Files } from '../types';

export interface ContextConfig {
  maxFiles: number;
  maxMessageHistory: number;
  maxFileSize: number;
  compressionThreshold: number;
}

export class SmartContextManager {
  private config: ContextConfig = {
    maxFiles: 16,
    maxMessageHistory: 50,
    maxFileSize: 50000, // 50KB per file
    compressionThreshold: 100000 // 100KB total
  };

  constructor(config?: Partial<ContextConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  // Select only the most relevant files based on modification history
  selectRelevantFiles(allFiles: Files, recentMessages: Message[]): Files {
    const fileUsage = new Map<string, number>();

    // Analyze recent messages for file references
    for (const message of recentMessages.slice(-20)) { // Last 20 messages
      this.extractFileReferences(message.content, fileUsage);
      if (message.attachments) {
        for (const attachment of message.attachments) {
          // Could analyze attachment names for file references
        }
      }
    }

    // Sort files by usage frequency
    const sortedFiles = Array.from(fileUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, this.config.maxFiles);

    // Filter files by size and create new Files object
    const relevantFiles: Files = {};
    let totalSize = 0;

    for (const [filePath, usage] of sortedFiles) {
      const content = allFiles[filePath];
      if (content && totalSize + content.length < this.config.maxFileSize) {
        relevantFiles[filePath] = content;
        totalSize += content.length;
      }
    }

    return relevantFiles;
  }

  // Compress old messages to save tokens
  compressMessageHistory(messages: Message[]): Message[] {
    if (messages.length <= this.config.maxMessageHistory) {
      return messages;
    }

    const recentMessages = messages.slice(-this.config.maxMessageHistory);
    const oldMessages = messages.slice(0, -this.config.maxMessageHistory);

    // Create a summary of old messages
    const summary = this.createMessageSummary(oldMessages);

    return [
      {
        role: 'system',
        content: `Previous conversation summary: ${summary}`
      },
      ...recentMessages
    ];
  }

  // Extract file references from message content
  private extractFileReferences(content: string, fileUsage: Map<string, number>) {
    // Look for file path patterns
    const filePatterns = [
      /File: ([^\n\r]*)/g,
      /filePath="([^"]*)"/g,
      /import.*from ['"]([^'"]*)['"]/g,
      /src\/([^\/\s]*)/g,
      /components\/([^\/\s]*)/g
    ];

    for (const pattern of filePatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const filePath = match[1];
        if (filePath) {
          fileUsage.set(filePath, (fileUsage.get(filePath) || 0) + 1);
        }
      }
    }
  }

  // Create a summary of old messages
  private createMessageSummary(messages: Message[]): string {
    const userMessages = messages.filter(m => m.role === 'user');
    const assistantMessages = messages.filter(m => m.role === 'model');

    let summary = '';

    if (userMessages.length > 0) {
      const latestUserRequest = userMessages[userMessages.length - 1].content;
      summary += `User requested: ${latestUserRequest.substring(0, 100)}... `;
    }

    if (assistantMessages.length > 0) {
      const latestAssistantResponse = assistantMessages[assistantMessages.length - 1].content;
      summary += `Assistant provided: ${latestAssistantResponse.substring(0, 100)}...`;
    }

    return summary || 'Previous conversation context';
  }

  // Optimize context based on available tokens
  optimizeContext(
    messages: Message[],
    files: Files,
    availableTokens: number = 100000
  ): { messages: Message[]; files: Files; compressionRatio: number } {
    let optimizedMessages = [...messages];
    let optimizedFiles = { ...files };
    let compressionRatio = 1;

    // Calculate current size
    const currentMessageSize = this.calculateMessageSize(optimizedMessages);
    const currentFileSize = this.calculateFileSize(optimizedFiles);
    const totalSize = currentMessageSize + currentFileSize;

    if (totalSize > availableTokens) {
      compressionRatio = availableTokens / totalSize;

      // First, compress message history
      optimizedMessages = this.compressMessageHistory(optimizedMessages);

      // Then, reduce file selection if still too large
      if (this.calculateTotalSize(optimizedMessages, optimizedFiles) > availableTokens) {
        const maxFiles = Math.max(1, Math.floor(this.config.maxFiles * compressionRatio));
        // Re-select files with stricter limits
        optimizedFiles = this.selectRelevantFiles(files, optimizedMessages.slice(-10));
      }
    }

    return {
      messages: optimizedMessages,
      files: optimizedFiles,
      compressionRatio
    };
  }

  private calculateMessageSize(messages: Message[]): number {
    return messages.reduce((total, message) => {
      return total + message.content.length + (message.attachments?.length || 0) * 1000;
    }, 0);
  }

  private calculateFileSize(files: Files): number {
    return Object.values(files).reduce((total, content) => total + content.length, 0);
  }

  private calculateTotalSize(messages: Message[], files: Files): number {
    return this.calculateMessageSize(messages) + this.calculateFileSize(files);
  }

  // Get context statistics
  getContextStats(messages: Message[], files: Files): {
    messageCount: number;
    fileCount: number;
    totalSize: number;
    compressionNeeded: boolean;
  } {
    const messageCount = messages.length;
    const fileCount = Object.keys(files).length;
    const totalSize = this.calculateTotalSize(messages, files);
    const compressionNeeded = totalSize > this.config.compressionThreshold;

    return {
      messageCount,
      fileCount,
      totalSize,
      compressionNeeded
    };
  }
}

// Singleton instance
export const contextManager = new SmartContextManager();