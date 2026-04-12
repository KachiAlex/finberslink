export function useChatMessages(threadId: string) {
  return {
    messages: [],
    isLoading: false,
    error: null,
  };
}

export function useChatThreads(userId: string) {
  return {
    threads: [],
    isLoading: false,
    error: null,
  };
}

export function useSendChatMessage() {
  return {
    sendMessage: async (threadId: string, message: string) => {
      return { id: '', content: message };
    },
    isLoading: false,
    error: null,
  };
}

export function useDirectConversations(userId: string) {
  return {
    conversations: [],
    isLoading: false,
    error: null,
  };
}

export function useConversationMessages(conversationId: string) {
  return {
    messages: [],
    isLoading: false,
    error: null,
  };
}

export function useSendDirectMessage() {
  return {
    sendMessage: async (conversationId: string, message: string) => {
      return { id: '', conversationId, content: message };
    },
    isLoading: false,
    error: null,
  };
}

export function useCreateDirectConversation() {
  return {
    createConversation: async (userId: string) => {
      return { id: '', participants: [userId], messages: [] };
    },
    isLoading: false,
    error: null,
  };
}

export function useChatSpaces(userId: string) {
  return {
    spaces: [],
    isLoading: false,
    error: null,
  };
}

export function useMarkThreadRead() {
  return {
    markRead: async (threadId: string) => {
      return { success: true };
    },
    isLoading: false,
    error: null,
  };
}

export type ChatSpace = any;
export type ChatThread = any;
export type ChatMessage = any;

