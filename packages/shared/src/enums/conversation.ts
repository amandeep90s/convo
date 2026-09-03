export type EConversationKind = 'direct' | 'group';

export const CONVERSATION_TYPES = ['private', 'group', 'community'] as const;
export type EConversationType = (typeof CONVERSATION_TYPES)[number];
