import type { Message, Files, FileAttachment, ApiResponse } from '../types';
import { AI_PROVIDERS, type AIProvider } from './aiAgentService';

// Multi-provider AI service for fallback and load balancing
export class MultiProviderService {
  private providers: AIProvider[] = [];
  private requestCount: Map<string, number> = new Map();

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // Initialize providers based on available API keys
    for (const provider of AI_PROVIDERS) {
      const apiKey = this.getApiKey(provider.apiKey);
      if (apiKey) {
        this.providers.push({
          ...provider,
          apiKey: apiKey
        });
      }
    }
  }

  private getApiKey(envVar: string): string | null {
    // Check environment variables for API keys
    if (typeof process !== 'undefined' && process.env) {
      return process.env[envVar] || null;
    }
    return null;
  }

  // Get the best provider for a request
  getBestProvider(preferredProvider?: string): AIProvider | null {
    if (preferredProvider && this.providers.find(p => p.id === preferredProvider)) {
      return this.providers.find(p => p.id === preferredProvider)!;
    }

    // Return provider with least requests (simple load balancing)
    if (this.providers.length === 0) return null;

    let bestProvider = this.providers[0];
    let minRequests = this.requestCount.get(bestProvider.id) || 0;

    for (const provider of this.providers) {
      const requests = this.requestCount.get(provider.id) || 0;
      if (requests < minRequests) {
        minRequests = requests;
        bestProvider = provider;
      }
    }

    return bestProvider;
  }

  // Make request with fallback to other providers
  async makeRequestWithFallback(
    messages: Message[],
    files: Files | null,
    attachments: FileAttachment[] | null,
    primaryProvider?: string
  ): Promise<ApiResponse> {
    const provider = this.getBestProvider(primaryProvider);
    if (!provider) {
      throw new Error('No AI providers available');
    }

    // Increment request count
    this.requestCount.set(provider.id, (this.requestCount.get(provider.id) || 0) + 1);

    try {
      // Try primary provider first
      return await this.makeProviderRequest(provider, messages, files, attachments);
    } catch (error) {
      console.error(`Primary provider ${provider.id} failed:`, error);

      // Try fallback providers
      const fallbackProviders = this.providers.filter(p => p.id !== provider.id);

      for (const fallbackProvider of fallbackProviders) {
        try {
          console.log(`Trying fallback provider: ${fallbackProvider.id}`);
          this.requestCount.set(fallbackProvider.id, (this.requestCount.get(fallbackProvider.id) || 0) + 1);
          return await this.makeProviderRequest(fallbackProvider, messages, files, attachments);
        } catch (fallbackError) {
          console.error(`Fallback provider ${fallbackProvider.id} also failed:`, fallbackError);
        }
      }

      throw new Error(`All AI providers failed. Primary: ${provider.id}, Fallbacks: ${fallbackProviders.map(p => p.id).join(', ')}`);
    }
  }

  private async makeProviderRequest(
    provider: AIProvider,
    messages: Message[],
    files: Files | null,
    attachments: FileAttachment[] | null
  ): Promise<ApiResponse> {
    switch (provider.id) {
      case 'gemini':
        const { sendAiChatRequest } = await import('./geminiService');
        return await sendAiChatRequest(messages, files, attachments);

      case 'claude':
        // TODO: Implement Claude API integration
        throw new Error('Claude integration not yet implemented');

      case 'openai':
        // TODO: Implement OpenAI API integration
        throw new Error('OpenAI integration not yet implemented');

      default:
        throw new Error(`Unknown provider: ${provider.id}`);
    }
  }

  // Get available providers
  getAvailableProviders(): AIProvider[] {
    return [...this.providers];
  }

  // Check if a specific provider is available
  isProviderAvailable(providerId: string): boolean {
    return this.providers.some(p => p.id === providerId);
  }

  // Get provider statistics
  getProviderStats(): Record<string, number> {
    return Object.fromEntries(this.requestCount.entries());
  }
}

// Singleton instance
export const multiProviderService = new MultiProviderService();