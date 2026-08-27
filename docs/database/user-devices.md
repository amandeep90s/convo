# `user_devices`

## Purpose

Tracks devices registered to a user for session management, device visibility, and push notifications.

## Features

- Supports `web`, `android`, `ios`, and `desktop` device types.
- Stores optional device label, push token, and public key.
- Tracks last activity and revocation time.
- Indexed by `user_id`.

## Relations

- Belongs to one `users` row.
- Has many `user_sessions` rows.
- User deletion cascades to devices and their sessions.
