import type { DatabaseDate } from './prisma-common.js';
import type { EDeviceType } from '../enums/index.js';

export type TUserDevice = {
  id: string;
  user_id: string;
  device_type: EDeviceType;
  device_name?: string | null;
  push_token?: string | null;
  public_key?: string | null;
  last_seen_at?: DatabaseDate | null;
  created_at: DatabaseDate;
  revoked_at?: DatabaseDate | null;
};
