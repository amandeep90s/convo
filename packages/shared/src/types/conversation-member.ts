import type { DatabaseDate } from './prisma-common.js';
import type { EMemberRole, ENotificationPolicy } from '../enums/conversation-member.js';

export type TConversationMember = {
  conversation_id: string;
  user_id: string;
  role: EMemberRole;
  joined_at: DatabaseDate;
  left_at?: DatabaseDate | null;
  muted_until?: DatabaseDate | null;
  notification_policy: ENotificationPolicy;
  archived_at?: DatabaseDate | null;
  last_read_message_id?: string | null;
  created_at: DatabaseDate;
};
