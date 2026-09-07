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
