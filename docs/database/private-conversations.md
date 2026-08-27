# `private_conversations`

## Purpose

Stores metadata specific to one-to-one conversations.

## Features

- Uses `conversation_id` as the primary key and one-to-one link to the conversation root.
- Stores two participant user IDs as `user_a_id` and `user_b_id`.
- `pair_key` is unique to prevent duplicate private conversations for the same user pair.

## Relations

- Belongs to one `conversations` row.
- References two `users` rows through the `user_a` and `user_b` roles.
- Deleting the conversation cascades to this record.
