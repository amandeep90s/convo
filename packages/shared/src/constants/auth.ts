export const USER_ROLES = ['admin', 'moderator', 'member'] as const;
export const USER_STATUSES = ['active', 'inactive', 'suspended'] as const;
export const AUTH_PROVIDERS = ['email', 'google', 'apple'] as const;

export const AUTH_DEFAULTS = {
  page: 1,
  limit: 20,
  passwordMinLength: 8,
} as const;
