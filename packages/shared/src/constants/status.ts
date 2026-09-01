export const MESSAGE_STATUSES = ['sent', 'delivered', 'read'] as const;
export const MESSAGE_TYPES = [
  'text',
  'image',
  'audio',
  'video',
  'file',
] as const;
export const CONVERSATION_TYPES = ['direct', 'group'] as const;

export const APP_STATUS = {
  active: 'active',
  archived: 'archived',
  deleted: 'deleted',
} as const;
