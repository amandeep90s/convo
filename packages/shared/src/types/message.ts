import type { DatabaseBigInt, DatabaseDate } from './prisma-common.js';
import type { EMessageDeletionKind, EMessageType } from '../enums/index.js';

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
