# Login OTPs

`login_otps` stores one active email login code per user. The API stores only a keyed HMAC of the six-digit code, expires it after 10 minutes, and deletes it after successful verification. Five failed attempts invalidate the code. Rows are removed when the associated user is deleted or their password is reset.

| Column | Type | Constraints |
| --- | --- | --- |
| `user_id` | UUID | Primary key; references `users.id` with cascade delete |
| `code_hash` | TEXT | Required; keyed hash of the code |
| `expires_at` | TIMESTAMPTZ | Required |
| `attempts` | INTEGER | Required; defaults to `0` |
| `created_at` | TIMESTAMPTZ | Required; defaults to current timestamp |
