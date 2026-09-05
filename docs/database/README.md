# Database Documentation

This directory documents the PostgreSQL tables represented by `packages/database/prisma/schema.prisma`.

## Table Index

| Table                                                     | Purpose                                              |
| --------------------------------------------------------- | ---------------------------------------------------- |
| [users](users.md)                                         | User accounts and profile information                |
| [user_settings](user-settings.md)                         | Per-user preferences and visibility settings         |
| [user_devices](user-devices.md)                           | Registered devices and push-notification credentials |
| [user_sessions](user-sessions.md)                         | Refresh-token sessions and session lifecycle         |
| [email_verification_tokens](email-verification-tokens.md) | Single-use tokens for verifying registration emails  |
| [contacts](contacts.md)                                   | User-owned contact relationships                     |
| [blocked_users](blocked-users.md)                         | User blocking relationships                          |
| [conversations](conversations.md)                         | Private, group, and community conversation roots     |
| [private_conversations](private-conversations.md)         | One-to-one conversation metadata                     |
| [groups](groups.md)                                       | Group conversation metadata                          |
| [conversation_members](conversation-members.md)           | Conversation membership and member state             |
| [messages](messages.md)                                   | Messages exchanged in conversations                  |
| [group_invites](group-invites.md)                         | Shareable invitations to groups                      |
| [pinned_messages](pinned-messages.md)                     | Messages pinned within conversations                 |
| [message_attachments](message-attachments.md)             | Files and media attached to messages                 |
| [message_reactions](message-reactions.md)                 | Emoji reactions on messages                          |
| [message_receipts](message-receipts.md)                   | Delivery and read state per recipient                |
| [calls](calls.md)                                         | Audio and video call records                         |
| [call_participants](call-participants.md)                 | Users participating in calls                         |

## Keeping Documentation Current

Update the relevant table document whenever the Prisma schema changes. The Prisma schema and migrations remain the source of truth for the actual database structure.
