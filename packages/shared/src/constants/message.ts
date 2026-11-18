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
export const MAX_MESSAGE_ATTACHMENT_BYTES = 20 * 1024 * 1024;
export const MESSAGE_AUDIO_MIME_TYPES = ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/webm', 'audio/mp4'] as const;
export const MESSAGE_ATTACHMENT_MIME_TYPES: readonly string[] = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  ...MESSAGE_AUDIO_MIME_TYPES,
  'application/pdf',
  'text/plain',
];
