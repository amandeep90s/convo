# `call_participants`

## Purpose

Associates users with calls and records when each participant joined or left.

## Features

- Composite primary key: `call_id` + `user_id`.
- Nullable join and leave timestamps support invited, joined, and departed states.
- Indexed by `user_id` for a user's call history.

## Relations

- Belongs to one `calls` row.
- Belongs to one `users` row.
- Deleting either parent cascades to the participant record.
