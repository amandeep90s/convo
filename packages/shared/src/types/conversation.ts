import type { DatabaseDate } from './prisma-common.js';
import type { EConversationType } from '@repo/db';

export type TConversation = {
  id: string;
  type: EConversationType;
  name?: string | null;
  avatar_url?: string | null;
  created_by: string;
  last_message_id?: string | null;
  last_message_at?: DatabaseDate | null;
  disappearing_message_ttl_seconds?: number | null;
  created_at: DatabaseDate;
  updated_at: DatabaseDate;
  deleted_at?: DatabaseDate | null;
};
