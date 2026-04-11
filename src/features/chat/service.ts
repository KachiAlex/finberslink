export async function getChatThreads() {
  return [];
}

export async function getChatMessages(threadId: string) {
  return [];
}

export async function sendChatMessage(threadId: string, message: string) {
  return { id: "", content: message };
}

export async function getConversation(conversationId: string) {
  return { id: conversationId, messages: [] };
}

export async function getOrCreateDirectConversation(userId1: string, userId2: string) {
  return { id: "", participants: [userId1, userId2], messages: [] };
}

export async function createGroupConversation(data: any) {
  return { id: "", name: data.name, participants: data.participants, messages: [] };
}

export async function listConversationMessages(conversationId: string) {
  return [];
}

export async function sendDirectMessage(conversationId: string, message: string) {
  return { id: "", conversationId, content: message };
}

export async function markDirectMessageRead(messageId: string) {
  return { id: messageId, readAt: new Date() };
}

export async function markConversationMessagesRead(conversationId: string) {
  return { conversationId, readAt: new Date() };
}
