# `message_reactions`

## Purpose

Stores emoji reactions added by users to messages.

## Features

- Composite primary key: `message_id` + `user_id`.
- Allows one reaction record per user per message under the current schema.
- Stores emoji value and creation timestamp.
- Indexed by `user_id`.

## Relations

- Belongs to one `messages` row.
- Belongs to one `users` row.
- Deleting either parent cascades to the reaction.
