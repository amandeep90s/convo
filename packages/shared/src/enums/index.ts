export enum EConversationType {
  PRIVATE = 'private',
  GROUP = 'group',
  COMMUNITY = 'community',
}

export enum EMessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  LOCATION = 'location',
  CONTACT = 'contact',
  SYSTEM = 'system',
  CALL = 'call',
}

export enum ECallType {
  AUDIO = 'audio',
  VIDEO = 'video',
}

export enum ECallStatus {
  RINGING = 'ringing',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  MISSED = 'missed',
  ENDED = 'ended',
}

export enum EDeviceType {
  WEB = 'web',
  ANDROID = 'android',
  IOS = 'ios',
  DESKTOP = 'desktop',
}

export enum EMemberRole {
  ADMIN = 'admin',
  MEMBER = 'member',
}

export enum ENotificationPolicy {
  ALL = 'all',
  MENTIONS_ONLY = 'mentions_only',
  NONE = 'none',
}

export enum EMessageDeletionKind {
  SENDER = 'sender',
  GROUP_ADMIN = 'group_admin',
  MODERATION = 'moderation',
  SYSTEM = 'system',
}

export enum EUserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BANNED = 'banned',
}

export enum EVisibility {
  EVERYONE = 'everyone',
  CONTACTS = 'contacts',
  NOBODY = 'nobody',
}
