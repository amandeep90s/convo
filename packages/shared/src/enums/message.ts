export type EMessageStatus = 'sent' | 'delivered' | 'read';

export type EMessageType =
  'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contact' | 'system' | 'call';

export type EMessageDeletionKind = 'sender' | 'group_admin' | 'moderation' | 'system';
