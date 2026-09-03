export type EMessageStatus = 'sent' | 'delivered' | 'read';

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
export type EMessageType = (typeof MESSAGE_TYPES)[number];

export const MESSAGE_DELETION_KINDS = ['sender', 'group_admin', 'moderation', 'system'] as const;
export type EMessageDeletionKind = (typeof MESSAGE_DELETION_KINDS)[number];
