import { GeminiProvider } from './providers/GeminiProvider';

/**
 * Unified Chat Service Router
 * Handles directing user prompts to the correct AI Provider
 * based on the selected model ID.
 */
class ChatService {
  constructor() {
    this.providers = {
      // Map model IDs to their respective handling logic
      'gemini-2.0-flash-lite-preview-02-05': GeminiProvider,
      'gemini-1.5-flash': GeminiProvider,
      'gemini-2.0-flash': GeminiProvider,
      'gemini-1.5-pro': GeminiProvider,
      'gemini-2.5-flash-lite': GeminiProvider, 
      'gemini-2.5-flash': GeminiProvider,
      'gemini-3.1-flash': GeminiProvider,
      'gemini-3.1-pro': GeminiProvider,
      'sonar': this.mockProvider,
      'gpt-4o': this.mockProvider,
      'gpt-5.4': this.mockProvider,
      'claude-3-5-sonnet': this.mockProvider,
      'claude-3-opus': this.mockProvider,
      'claude-sonnet': this.mockProvider,
      'claude-opus': this.mockProvider,
      'nemotron': GeminiProvider,
      'minimax-m2.7': GeminiProvider,
      'deepseek-v3.2': GeminiProvider,
      'gemma-3-27b-it': GeminiProvider,
    };
  }

  /**
   * Main entry point to generate a response.
   * Can be upgraded later to handle real streaming APIs via fetch/SSE.
   */
  async generateResponse(modelId, messages, onChunk, options = {}) {
    const provider = this.providers[modelId];
    
    if (!provider) {
      throw new Error(`Unsupported model selected: ${modelId}`);
    }

    // Call the specific provider handler (passes through options like signal)
    return provider(modelId, messages, onChunk, options);
  }

  /**
   * MOCK PROVIDER
   * Since this is a pure frontend right now, we simulate an AI stream.
   * In production, this will be replaced by specific fetch() calls 
   * to your Node.js backend or directly to the LLM APIs (if keys are passed).
   */
  async mockProvider(modelId, messages, onChunk) {
    const lastMessage = messages[messages.length - 1].content;
    
    const mockResponseText = `This is a simulated ${modelId} response to your prompt: "${lastMessage}"\n\nIn a production environment, this text will stream directly from the authentic API using the keys provided. The architecture is fully set up to replace this mock function with real HTTP calls!`;

    // Simulate streaming delay
    const words = mockResponseText.split(' ');
    let currentText = '';

    for (let i = 0; i < words.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 30)); // 30ms per word artificial delay
      currentText += (i === 0 ? '' : ' ') + words[i];
      
      // Fire the chunk callback so the UI updates in real-time
      if (onChunk) {
        onChunk(currentText);
      }
    }

    return currentText;
  }
}

export const chatService = new ChatService();
