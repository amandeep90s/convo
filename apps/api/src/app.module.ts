import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BlockedUsersModule } from './blocked-users/blocked-users.module';
import { CallParticipantsModule } from './call-participants/call-participants.module';
import { CallsModule } from './calls/calls.module';
import { ContactsModule } from './contacts/contacts.module';
import { ConversationMembersModule } from './conversation-members/conversation-members.module';
import { ConversationsModule } from './conversations/conversations.module';
import { GroupInvitesModule } from './group-invites/group-invites.module';
import { GroupsModule } from './groups/groups.module';
import { MessageAttachmentsModule } from './message-attachments/message-attachments.module';
import { MessageReactionsModule } from './message-reactions/message-reactions.module';
import { MessageReceiptsModule } from './message-receipts/message-receipts.module';
import { MessagesModule } from './messages/messages.module';
import { PinnedMessagesModule } from './pinned-messages/pinned-messages.module';
import { PrismaService } from './prisma.service';
import { PrivateConversationsModule } from './private-conversations/private-conversations.module';
import { UserDevicesModule } from './user-devices/user-devices.module';
import { UserSessionsModule } from './user-sessions/user-sessions.module';
import { UserSettingsModule } from './user-settings/user-settings.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    AuthModule,
    MessagesModule,
    UserDevicesModule,
    UserSessionsModule,
    ContactsModule,
    BlockedUsersModule,
    ConversationsModule,
    PrivateConversationsModule,
    GroupsModule,
    ConversationMembersModule,
    GroupInvitesModule,
    PinnedMessagesModule,
    MessageAttachmentsModule,
    MessageReactionsModule,
    MessageReceiptsModule,
    CallsModule,
    CallParticipantsModule,
    UsersModule,
    UserSettingsModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
