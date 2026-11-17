export const MESSAGE_TYPES = [
  'text',
  'image',
  'video',
  'audio',
  'document',
  'location',
  'contact',
  'system',
  'call',
] as const;
export const MESSAGE_DELETION_KINDS = ['sender', 'group_admin', 'moderation', 'system'] as const;
export const MESSAGE_EDIT_WINDOW_MS = 15 * 60 * 1000;
