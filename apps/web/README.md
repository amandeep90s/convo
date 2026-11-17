# Convo web client

The web client is the Next.js application in this workspace. The repository-level [README](../../README.md) contains setup, environment, database, and workspace commands. See the [product scope and development plan](../../docs/project-scope.md) for current UI status and planned work.

Run the client from the repository root with:

```bash
pnpm --dir apps/web dev
```

The client uses the shared workspace packages; install dependencies from the repository root, not from this directory.

## Sign-in and appearance

The single sign-in form validates email/username and password before requesting an email OTP. Only successful code verification establishes a session. The example environment sets access-token lifetime to one hour while retaining automatic refresh.

The homepage checks existing sessions through the authenticated proxy before showing chat/settings links instead of sign-in/register links. Authentication pages use the same check and redirect signed-in users to `/chat`; private pages redirect guests to `/login`. Refresh-only sessions use the proxy's existing refresh flow. Invalid credentials are treated as signed out, while service failures show a retryable error instead of causing a redirect loop.

Public and private headers expose theme and English/Punjabi/Hindi language controls. Language is selected through the `locale` cookie; account language settings also save to the API. UI catalogs live in `messages/`; source phrases map to stable keys using `i18n/message-key.ts`. User-written messages, names, filenames, and descriptions are not translated. Unknown API diagnostics remain visible in their original wording.

## Live messages

Chats open at the latest message and scroll down after sending. Incoming messages follow the bottom only when the reader is already within 80 pixels of it; reading older messages or loading history does not force a jump to the latest message.

Recent, archived and starred lists load 50 conversations per page with a retryable Load more control. Search is debounced and runs on the server across all eligible conversations, matching conversation names or other active participants' names/usernames. Each filter/search has its own paginated cache.

Message menus include Reply and Pin/Unpin. Text and attachment replies include a quoted original; clicking a quote or pinned item focuses a loaded message or opens a separately fetched preview when it is outside loaded history. Hidden, deleted, expired or inaccessible originals are not included in reply previews. The header pin button opens the current pinned list; pins and reactions synchronize over sockets, with polling recovery.

Reaction buttons show aggregated counts and highlight your own reaction. The emoji picker adds or replaces your one reaction per message; choosing the same emoji removes it.

Unsent text drafts are saved per account and conversation in this tab's `sessionStorage`, survive navigation/reloads, and are cleared after successful text sending. Closing the tab ends draft retention; files and reply selections are not persisted. Storage failures are shown explicitly. Drafts are not sent to other devices.

Typing indicators use the existing authenticated socket, current membership/session/block checks, throttled updates, a three-second idle stop and six-second recipient expiry. They are ephemeral, not stored, and do not play notification sounds. Names come from the conversation's active members.

An unread divider captures the initial server read-cursor boundary (independent of read-receipt sharing); load earlier messages if the boundary is outside the current page. Only messages intersecting the visible chat viewport are acknowledged. Jump to latest appears while reading above the bottom. Loading older history preserves the scroll position, and changing chats resets navigation state.

The attachment composer uses one multipart upload-and-send request. File storage completes before the message and attachment are committed together; only then are previews, receipts and realtime notifications published. Storage/database failures do not publish an empty attachment message. Failed database writes remove the newly stored file; already-committed files are retained if realtime delivery fails. The older upload-to-existing-message endpoint remains available for compatibility.

Message menus offer **Delete for me** on both sent and received messages (stored per account and shared across its devices). Senders or group admins can use **Delete for everyone**, including admins acting on received group messages (permanently removes the message row, receipts, reactions, pins, hiding records and stored attachments/thumbnails). Replies lose their reference to the removed message. Read cursors and conversation previews are repaired. Cleanup errors fail the request and leave a hidden, redacted tombstone so the same DELETE request can be retried; success is returned only after cleanup completes. Senders can edit their own text messages for 15 minutes; the API enforces the deadline and the UI labels edited messages. Editing uses the shared schema with React Hook Form. Delete actions require confirmation. Previously downloaded files and backups cannot be recalled.

**Delete chat** is available in conversation menus and the chat header. Either private-chat participant, or a group admin, can remove the entire chat and its history for everyone. Connected participants are returned to the chat list. A new private chat with the same person starts with empty history; old history is not restored. These are application-level soft deletions, not physical file-storage erasure.

Before deploying this feature, apply the `20261117110000_add_hidden_messages` migration and regenerate Prisma on the machine with dependencies: `pnpm --filter @repo/db db:deploy`, then `pnpm --filter @repo/db db:generate`. Rebuild shared/database/API packages as usual. No dependencies were added.

Private chat rows and headers show presence as a small avatar badge (green online, gray offline), with an accessible label rather than a separate status line. For contacts-only online visibility, a saved contact in either direction allows both users to see presence; explicit Nobody settings and blocks still hide it. Online means at least one valid authenticated socket remains connected, including other tabs/devices. Presence changes refresh immediately over sockets, with a 30-second polling fallback. Chat rows place time above the unread count and keep star/archive actions in an overflow menu. Opening a visible chat clears server-backed unread counts through the read cursor even with read-receipt sharing disabled.

The composer lazily loads the existing `emoji-picker-react` package. Emojis replace selected text or insert at the caret, retain the message length limit, and use native glyphs rather than external image requests. Picker controls/categories follow English/Punjabi/Hindi and the current theme. Hindi uses the package's Hindi search dataset; Punjabi emoji names/search use its English dataset because the package does not provide Punjabi.

The private app connects directly to the API's Socket.IO server using a short-lived socket-only ticket obtained through the authenticated Next.js proxy. Set server-side `REALTIME_URL` to the browser-reachable API origin when it differs from the origin of `API_BASE_URL`. The API must allow the web origin through `CORS_ORIGINS` or `WEB_URL`; production proxies must forward WebSocket upgrades for `/socket.io/`.

Incoming events refresh conversations, messages, attachments, and receipt indicators. Reconnects refetch current data, with polling as a fallback. The private header bell lists up to 50 recent eligible message alerts with an unread badge and mark-as-read controls. This list lasts for the mounted application session, not across reloads. Message/chat deletion removes matching bell/toast alerts and closes browser notifications. Incoming alerts verify that the message still exists; reconnect, tab visibility, network recovery and 30-second reconciliation remove stale alerts after missed events. Notification settings include an explicit browser-permission button. In-app alerts and permitted hidden-tab browser notifications work while the app is running; notifications after the browser is closed require a future Web Push implementation.

Settings > Notifications also includes an opt-in notification sound, saved only in the current browser. Enabling it previews a short synthesized chime; no audio file or additional dependency is needed. After reopening the app, click or press a key to unlock browser audio playback. Only eligible incoming message alerts play a sound: own messages, duplicates, muted/disabled notifications, and the currently visible chat do not. Bursts are limited to one chime per 750 ms, and desktop alerts are silent to avoid playing a second system sound.

The API's `tests/realtime.spec.ts` exercises two authenticated sockets against PostgreSQL and Redis, including recipients outside the active chat, notification preferences, attachment completion, and receipts. Build the API before running its existing Playwright test command. The web test files have been removed for now; the Playwright configuration, dependency, and `test:e2e` script remain in place for future tests.
