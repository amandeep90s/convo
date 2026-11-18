import type { DatabaseDate } from './prisma-common.js';
import type { EConversationType } from '@repo/db';
import type { TUser } from './user.js';
import type { TMessage } from './message.js';
import type { TConversationMember } from './conversation-member.js';

export type UserPresence = 'online' | 'offline' | null;
export type ChatParticipant = Pick<TUser, 'id' | 'name' | 'username' | 'avatar_url'> & {
  presence: UserPresence;
};

export type ConversationListItem = Pick<TConversation, 'id' | 'name' | 'type'> & {
  is_saved: boolean;
  last_message_at: string | null;
  unread_count: number;
  members: Array<{
    user_id: string;
    role: TConversationMember['role'];
    archived_at: string | null;
    starred_at: string | null;
    user: ChatParticipant;
  }>;
  messages: Array<Pick<TMessage, 'id' | 'type' | 'content'> & { created_at: string; expires_at: string | null }>;
};

export type ChatConversation = Pick<TConversation, 'id' | 'name' | 'type' | 'disappearing_message_ttl_seconds'> & {
  is_saved: boolean;
  group: { name: string; description: string | null } | null;
  members: Array<{
    user_id: string;
    role: TConversationMember['role'];
    last_read_message_id?: string | null;
    notification_policy: TConversationMember['notification_policy'];
    muted_until: string | null;
    user: ChatParticipant;
  }>;
};

export type ConversationListResponse = {
  data: ConversationListItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

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
