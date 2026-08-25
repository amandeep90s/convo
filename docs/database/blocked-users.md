# `blocked_users`

## Purpose

Stores directed user-blocking relationships.

## Features

- Composite primary key: `user_id` + `blocked_user_id`.
- Keeps the blocker and blocked user roles explicit.
- Records when the block was created.

## Relations

- `user_id` is the blocking user.
- `blocked_user_id` is the blocked user.
- Both columns reference `users`; deleting either user cascades to the row.
