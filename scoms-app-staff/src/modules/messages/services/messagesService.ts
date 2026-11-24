import { apiClient } from '../../../services/api/client';
import { ApiEnvelope } from '../../../types/api';

export interface ChatStudent {
  userId: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
  section: { name: string } | null;
  lastMessage: { content: string; createdAt: string; fromMe: boolean } | null;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
}

/** Students in classes I teach, each with our latest message. */
export async function fetchChatStudents(): Promise<ChatStudent[]> {
  const { data } = await apiClient.get<ApiEnvelope<ChatStudent[]>>('/messages/students');
  return data.data ?? [];
}

/** Latest 200 messages with one student, oldest first — or, with `after` (ISO date), only the newer ones. */
export async function fetchConversation(withUserId: string, after?: string): Promise<ChatMessage[]> {
  const { data } = await apiClient.get<ApiEnvelope<ChatMessage[]>>('/messages/conversation', { params: { withUserId, ...(after ? { after } : {}) } });
  return data.data ?? [];
}

export async function sendChatMessage(receiverId: string, content: string): Promise<ChatMessage> {
  const { data } = await apiClient.post<ApiEnvelope<ChatMessage>>('/messages', { receiverId, content });
  return data.data;
}
