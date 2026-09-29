import { SumanProvider } from './providers/SumanProvider';

class ChatService {
  async generateResponse(modelId, messages, onChunk, options = {}) {
    return SumanProvider(modelId, messages, onChunk, options);
  }
}

export const chatService = new ChatService();
