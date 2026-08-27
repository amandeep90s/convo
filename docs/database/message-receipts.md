# `message_receipts`

## Purpose

Tracks message delivery and read status for each recipient.

## Features

- Composite primary key: `message_id` + `user_id`.
- Nullable `delivered_at` and `read_at` support progressive receipt state.
- Indexed by `user_id` for recipient-centric queries.

## Relations

- Belongs to one `messages` row.
- Belongs to one recipient in `users`.
- Deleting either parent cascades to the receipt.
