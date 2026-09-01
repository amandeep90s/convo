import type { DatabaseDate } from './prisma-common.js';

export type TGroup = {
  conversation_id: string;
  description?: string | null;
  created_by: string;
  created_at: DatabaseDate;
  updated_at: DatabaseDate;
};
