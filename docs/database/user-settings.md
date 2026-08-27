# `user_settings`

## Purpose

Stores preferences that control a user's language, theme, notification behavior, and presence/privacy visibility.

## Features

- Uses `user_id` as both primary key and foreign key, enforcing one settings row per user.
- Defaults language to `en` and theme to `system`.
- Controls read receipts, notifications, last-seen visibility, online visibility, and profile visibility.

## Relations

- Belongs to exactly one `users` row through `user_id`.
- Deleting the user cascades to this record.
