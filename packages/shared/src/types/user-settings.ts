import type { DatabaseDate } from './prisma-common.js';
import type { EVisibility } from '../enums/index.js';

export type TUserSettings = {
  user_id: string;
  language: string;
  theme: string;
  read_receipts: boolean;
  last_seen_visibility: EVisibility;
  online_visibility: EVisibility;
  profile_visibility: EVisibility;
  notification_enabled: boolean;
  created_at: DatabaseDate;
  updated_at: DatabaseDate;
};
