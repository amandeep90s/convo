# `messages`

## Purpose

Stores conversation messages, sender information, reply chains, content, metadata, and deletion state.

## Features

- Supports text, media, documents, location, contact, system, and call message types.
- Optional JSONB metadata for type-specific data.
- Supports soft deletion and deletion attribution.
- Supports disappearing messages through `expires_at`.
- Self-relation supports replies and nested reply lookup.
- Indexed for conversation timelines, sender queries, replies, and expiry processing.

## Relations

- Belongs to one `conversations` row and one sending `users` row.
- Optionally belongs to a deleting `users` row.
- Optionally references another `messages` row through `reply_to_id`; a message can have many replies.
- Has many `message_attachments`, `message_reactions`, `message_receipts`, and `pinned_messages` rows.
- Deleting the conversation or message cascades to dependent message records where configured.
