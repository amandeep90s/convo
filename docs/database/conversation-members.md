# `conversation_members`

## Purpose

Associates users with conversations and stores each member's role, notification behavior, archive state, and read position.

## Features

- Composite primary key: `conversation_id` + `user_id`.
- Supports `admin` and `member` roles.
- Supports notification policies: `all`, `mentions_only`, and `none`.
- Tracks join, leave, mute, archive, and last-read-message state.
- Indexed by `user_id` for listing a user's conversations.

## Relations

- Belongs to one `conversations` row.
- Belongs to one `users` row.
- Deleting either parent cascades to the membership.
