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
