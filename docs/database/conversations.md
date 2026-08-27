# `conversations`

## Purpose

Acts as the common root for private, group, and community conversations and stores their shared metadata.

## Features

- Supports `private`, `group`, and `community` conversation types.
- Stores optional name and avatar.
- Tracks creator, last-message summary, disappearing-message TTL, and lifecycle timestamps.
- Indexed by creator and last-message time.

## Relations

- Belongs to one creator in `users`.
- Has many `conversation_members`, `messages`, `pinned_messages`, `group_invites` through `groups`, and `calls`.
- Has at most one `private_conversations` row and at most one `groups` row.
- Deleting a conversation cascades to dependent conversation records.
