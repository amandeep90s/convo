# `calls`

## Purpose

Records audio and video calls associated with conversations.

## Features

- Supports `audio` and `video` call types.
- Tracks lifecycle with `ringing`, `accepted`, `rejected`, `missed`, and `ended` statuses.
- Stores initiator, start time, end time, and creation time.
- Indexed by conversation and initiator.

## Relations

- Belongs to one `conversations` row.
- Belongs to one initiating `users` row.
- Has many `call_participants` rows.
- Deleting the conversation cascades to its calls and participants.
