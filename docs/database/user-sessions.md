# `user_sessions`

## Purpose

Stores authenticated device sessions and hashed refresh tokens.

## Features

- Stores a refresh-token hash rather than a raw refresh token.
- Tracks IP address, user agent, expiry, creation, and revocation.
- Indexed by both `user_id` and `device_id`.

## Relations

- Belongs to one `users` row.
- Belongs to one `user_devices` row.
- Deleting either parent cascades to the session.
