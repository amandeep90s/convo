import type { TMessage, TMessageReceipt } from './message.js';
import type { TUser } from './user.js';
import type { TypingInput } from '../schemas/message.js';

export type RealtimeSession = { token: string; url: string };
export type RealtimeMessage = Pick<TMessage, 'id' | 'conversation_id' | 'sender_id' | 'type' | 'content'> & {
  sender: Pick<TUser, 'id' | 'name'>;
};
export type ConversationEvent = { conversation_id: string };
export type MessageChangeEvent = ConversationEvent & { id: string };
export type TypingEvent = TypingInput & { user_id: string };
export interface ClientRealtimeEvents {
  'conversation:typing': (event: TypingInput, acknowledge: (result: { ok: boolean }) => void) => void;
}

export interface ServerRealtimeEvents {
  'presence:updated': () => void;
  'message:created': (message: RealtimeMessage) => void;
  'message:notification': (message: RealtimeMessage) => void;
  'message:updated': (event: MessageChangeEvent) => void;
  'message:deleted': (event: MessageChangeEvent) => void;
  'message:attachment': (event: ConversationEvent) => void;
  'message:reaction': (event: ConversationEvent) => void;
  'message:pinned': (event: MessageChangeEvent) => void;
  'conversation:typing': (event: TypingEvent) => void;
  'message:receipt': (event: ConversationEvent & TMessageReceipt) => void;
  'conversation:updated': (event: ConversationEvent) => void;
  'conversation:deleted': (event: ConversationEvent) => void;
  'call:incoming': (event: { id: string; conversation_id: string }) => void;
  'call:updated': (event: { id: string; conversation_id: string }) => void;
}
