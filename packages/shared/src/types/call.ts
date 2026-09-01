import type { DatabaseDate } from './prisma-common.js';
import type { ECallStatus, ECallType } from '../enums/call.js';

export type TCall = {
  id: string;
  conversation_id: string;
  initiated_by: string;
  type: ECallType;
  status: ECallStatus;
  started_at?: DatabaseDate | null;
  ended_at?: DatabaseDate | null;
  created_at: DatabaseDate;
};

export type TCallParticipant = {
  call_id: string;
  user_id: string;
  joined_at?: DatabaseDate | null;
  left_at?: DatabaseDate | null;
};
