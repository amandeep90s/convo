export const CALL_TYPES = ['audio', 'video'] as const;
export type ECallType = (typeof CALL_TYPES)[number];

export const CALL_STATUSES = ['ringing', 'accepted', 'rejected', 'missed', 'ended'] as const;
export type ECallStatus = (typeof CALL_STATUSES)[number];
