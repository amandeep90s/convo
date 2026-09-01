import type { DatabaseDate } from './prisma-common.js';

export type TGroupInvite = {
  id: string;
  conversation_id: string;
  code: string;
  created_by: string;
  expires_at?: DatabaseDate | null;
  max_uses?: number | null;
  use_count: number;
  revoked_at?: DatabaseDate | null;
  created_at: DatabaseDate;
  updated_at: DatabaseDate;
};
