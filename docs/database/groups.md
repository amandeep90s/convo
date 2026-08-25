# `groups`

## Purpose

Stores metadata for group conversations, including description and creator ownership.

## Features

- Uses `conversation_id` as both primary key and link to the conversation root.
- Tracks the group creator and lifecycle timestamps.
- Supports related group invitations.

## Relations

- Belongs to one `conversations` row.
- Belongs to one creator in `users`.
- Has many `group_invites` rows.
- Deleting the conversation cascades to the group and its invites.
