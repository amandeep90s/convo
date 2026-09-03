export const USER_ACCOUNT_STATUSES = ['active', 'inactive', 'banned'] as const;
export type EUserStatus = (typeof USER_ACCOUNT_STATUSES)[number];
