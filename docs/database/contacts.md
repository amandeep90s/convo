# `contacts`

## Purpose

Represents a user's saved contact relationship with another user.

## Features

- Composite primary key: `user_id` + `contact_user_id`.
- Optional per-contact nickname.
- Creation timestamp for relationship history.
- Supports two distinct user roles: owner and contacted user.

## Relations

- `user_id` belongs to the owning `users` row.
- `contact_user_id` belongs to the referenced `users` row.
- Deleting either user cascades to the contact row.
