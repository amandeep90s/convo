import {
  createBlockedUserSchema,
  createCallParticipantSchema,
  createCallSchema,
  createContactSchema,
  createConversationMemberSchema,
  createConversationSchema,
  createGroupInviteSchema,
  createGroupSchema,
  createMessageAttachmentSchema,
  createMessageReactionSchema,
  createMessageReceiptSchema,
  createMessageSchema,
  createPinnedMessageSchema,
  createPrivateConversationSchema,
  createUserDeviceSchema,
  createUserSettingsSchema,
  deleteMessageParamsSchema,
  listConversationsParamsSchema,
  paginationParamsSchema,
  searchMessagesParamsSchema,
  updateCallParticipantSchema,
  updateCallSchema,
  updateContactSchema,
  updateConversationMemberSchema,
  updateConversationSchema,
  updateGroupInviteSchema,
  updateGroupSchema,
  updateMessageSchema,
  updateUserDeviceSchema,
  updateUserSchema,
  updateUserSettingsSchema,
} from '@repo/shared';
import { createZodDto } from 'nestjs-zod';

export class PaginationDto extends createZodDto(paginationParamsSchema) {}
export class ListConversationsDto extends createZodDto(
  listConversationsParamsSchema,
) {}
export class CreateMessageDto extends createZodDto(createMessageSchema) {}
export class SearchMessagesDto extends createZodDto(
  searchMessagesParamsSchema,
) {}
export class UpdateMessageDto extends createZodDto(updateMessageSchema) {}
export class DeleteMessageParamsDto extends createZodDto(
  deleteMessageParamsSchema,
) {}
export class CreateConversationDto extends createZodDto(
  createConversationSchema,
) {}
export class UpdateConversationDto extends createZodDto(
  updateConversationSchema,
) {}
export class CreateConversationMemberDto extends createZodDto(
  createConversationMemberSchema,
) {}
export class UpdateConversationMemberDto extends createZodDto(
  updateConversationMemberSchema,
) {}
export class CreatePrivateConversationDto extends createZodDto(
  createPrivateConversationSchema,
) {}
export class CreateContactDto extends createZodDto(createContactSchema) {}
export class UpdateContactDto extends createZodDto(updateContactSchema) {}
export class CreateBlockedUserDto extends createZodDto(
  createBlockedUserSchema,
) {}
export class CreateGroupDto extends createZodDto(createGroupSchema) {}
export class UpdateGroupDto extends createZodDto(updateGroupSchema) {}
export class CreateGroupInviteDto extends createZodDto(
  createGroupInviteSchema,
) {}
export class UpdateGroupInviteDto extends createZodDto(
  updateGroupInviteSchema,
) {}
export class CreateMessageReactionDto extends createZodDto(
  createMessageReactionSchema,
) {}
export class CreateMessageReceiptDto extends createZodDto(
  createMessageReceiptSchema,
) {}
export class CreatePinnedMessageDto extends createZodDto(
  createPinnedMessageSchema,
) {}
export class CreateMessageAttachmentDto extends createZodDto(
  createMessageAttachmentSchema,
) {}
export class CreateCallDto extends createZodDto(createCallSchema) {}
export class UpdateCallDto extends createZodDto(updateCallSchema) {}
export class CreateCallParticipantDto extends createZodDto(
  createCallParticipantSchema,
) {}
export class UpdateCallParticipantDto extends createZodDto(
  updateCallParticipantSchema,
) {}
export class CreateUserDeviceDto extends createZodDto(createUserDeviceSchema) {}
export class UpdateUserDeviceDto extends createZodDto(updateUserDeviceSchema) {}
export class CreateUserSettingsDto extends createZodDto(
  createUserSettingsSchema,
) {}
export class UpdateUserSettingsDto extends createZodDto(
  updateUserSettingsSchema,
) {}
export class UpdateUserDto extends createZodDto(updateUserSchema) {}
