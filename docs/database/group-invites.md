# `group_invites`

## Purpose

Provides controlled, shareable invitations for users to join group conversations.

## Features

- UUID primary key and unique invite `code`.
- Optional expiration and maximum-use limit.
- Tracks use count, revocation, creator, and lifecycle timestamps.
- Indexed by group conversation and creator.

## Relations

- Belongs to one `groups` row through `conversation_id`.
- Belongs to one creator in `users`.
- Deleting the group cascades to its invites.
