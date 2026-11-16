# Password resets

`password_resets` stores one-time password reset tokens as hashes. The API replaces any previous token for the account when a new reset request is made, expires tokens after 15 minutes, and deletes the token after a successful reset.

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | UUID | Primary key |
| `user_id` | UUID | Required; references `users.id` with cascade delete |
| `token_hash` | TEXT | Required; unique |
| `expires_at` | TIMESTAMPTZ | Required |
| `created_at` | TIMESTAMPTZ | Required; defaults to current timestamp |
