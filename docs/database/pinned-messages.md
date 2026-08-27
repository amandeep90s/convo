# `pinned_messages`

## Purpose

Associates messages pinned within conversations with the user who pinned them.

## Features

- Composite primary key: `conversation_id` + `message_id`.
- Records the pinning user and timestamp.
- Prevents the same message from being pinned twice in one conversation.
- Indexed by message and pinner.

## Relations

- Belongs to one `conversations` row.
- Belongs to one `messages` row.
- Belongs to one pinning `users` row.
- Deleting the conversation or message cascades to the pin record.
