import type { TMessage, TMessageReceipt } from './message.js';
import type { TUser } from './user.js';

export type RealtimeSession = { token: string; url: string };
export type RealtimeMessage = Pick<TMessage, 'id' | 'conversation_id' | 'sender_id' | 'type' | 'content'> & {
  sender: Pick<TUser, 'id' | 'name'>;
};
export type ConversationEvent = { conversation_id: string };

export interface ServerRealtimeEvents {
  'message:created': (message: RealtimeMessage) => void;
  'message:notification': (message: RealtimeMessage) => void;
  'message:updated': (event: ConversationEvent) => void;
  'message:deleted': (event: ConversationEvent) => void;
  'message:attachment': (event: ConversationEvent) => void;
  'message:reaction': (event: ConversationEvent) => void;
  'message:receipt': (event: ConversationEvent & TMessageReceipt) => void;
  'conversation:updated': (event: ConversationEvent) => void;
  'call:incoming': (event: { id: string; conversation_id: string }) => void;
  'call:updated': (event: { id: string; conversation_id: string }) => void;
}
