import type { DatabaseDate } from './prisma-common.js';

export type TUserSession = {
  id: string;
  user_id: string;
  device_id: string;
  refresh_token_hash: string;
  ip_address?: string | null;
  user_agent?: string | null;
  expires_at: DatabaseDate;
  created_at: DatabaseDate;
  revoked_at?: DatabaseDate | null;
};
