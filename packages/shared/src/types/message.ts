import type { DatabaseBigInt, DatabaseDate } from './prisma-common.js';
import type { EMessageDeletionKind, EMessageType } from '@repo/db';
import type { TUser } from './user.js';

export type MessagePreview = Pick<TMessage, 'id' | 'type'> & {
  content: string | null;
  sender: Pick<TUser, 'id' | 'name'>;
};

export type ChatMessage = MessagePreview & {
  sender_id: string;
  reply_to_id?: string | null;
  reply?: MessagePreview | null;
  created_at: string;
  edited_at?: string | null;
  attachments: Array<Pick<TMessageAttachment, 'id' | 'mime_type'> & { file_name: string | null }>;
  receipts: TMessageReceipt[];
  reactions: TMessageReaction[];
};

export type ChatMessagePage = {
  items: ChatMessage[];
  nextCursor: string | null;
  hasMore: boolean;
  firstUnreadId?: string | null;
};

export type ChatPinnedMessage = Pick<TPinnedMessage, 'message_id' | 'pinned_by'> & {
  message: MessagePreview;
};

export type TMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  reply_to_id?: string | null;
  type: EMessageType;
  content?: string | null;
  metadata?: Record<string, unknown> | null;
  edited_at?: DatabaseDate | null;
  deleted_by_id?: string | null;
  deletion_kind?: EMessageDeletionKind | null;
  expires_at?: DatabaseDate | null;
  created_at: DatabaseDate;
  updated_at: DatabaseDate;
  deleted_at?: DatabaseDate | null;
};

export type TMessageAttachment = {
  id: string;
  message_id: string;
  type: EMessageType;
  storage_key: string;
  mime_type: string;
  file_name?: string | null;
  file_size?: DatabaseBigInt | null;
  width?: number | null;
  height?: number | null;
  duration_ms?: DatabaseBigInt | null;
  thumbnail_key?: string | null;
  created_at: DatabaseDate;
};

export type TMessageReaction = {
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: DatabaseDate;
};

export type TMessageReceipt = {
  message_id: string;
  user_id: string;
  delivered_at?: DatabaseDate | null;
  read_at?: DatabaseDate | null;
};

export type TPinnedMessage = {
  conversation_id: string;
  message_id: string;
  pinned_by: string;
  pinned_at: DatabaseDate;
};
