export const MEMBER_ROLES = ['admin', 'member'] as const;
export type EMemberRole = (typeof MEMBER_ROLES)[number];

export const NOTIFICATION_POLICIES = ['all', 'mentions_only', 'none'] as const;
export type ENotificationPolicy = (typeof NOTIFICATION_POLICIES)[number];
