# `message_attachments`

## Purpose

Stores file and media metadata attached to a message while the actual content remains in external storage.

## Features

- Stores storage key, MIME type, optional filename, and file size.
- Supports image/video dimensions, audio/video duration, and thumbnail storage key.
- Uses `MessageType` to classify the attachment.
- Indexed by `message_id`.

## Relations

- Belongs to one `messages` row.
- Deleting the message cascades to its attachments.
