import type { DatabaseDate } from './prisma-common.js';
import type { EUserStatus } from '../enums/user.js';

export type TUser = {
  id: string;
  phone?: string | null;
  email: string;
  username: string;
  name: string;
  about?: string | null;
  avatar_url?: string | null;
  password_hash?: string | null;
  status: EUserStatus;
  created_at: DatabaseDate;
  updated_at: DatabaseDate;
  deleted_at?: DatabaseDate | null;
};
