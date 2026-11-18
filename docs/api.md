# API reference

The HTTP API is prefixed with `/api/v1`. Successful JSON responses use the standard envelope; errors use the API error envelope. All routes below require a bearer access token unless marked **Public**. Identifiers are UUIDs.

Interactive Swagger documentation is available at `/api/v1/docs`. Request bodies and DTO-based query parameters are generated from the shared Zod schemas. Successful responses show the standard response envelope, authenticated operations use the `access-token` bearer scheme, and file upload/download operations document their binary payloads.

## Authentication

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/register` | Public | Register and queue an email verification message |
| POST | `/auth/verify-email` | Public | Verify an email token |
| POST | `/auth/resend-verification` | Public | Resend verification instructions |
| POST | `/auth/login` | Public | Validate credentials and send an email login code |
| POST | `/auth/login/otp/request` | Public | Credential-validated alias for requesting a login code |
| POST | `/auth/login/otp/verify` | Public | Verify the credential-bound challenge and code, then create a device/session |
| POST | `/auth/refresh` | Public | Rotate a refresh token and issue a new access token |
| POST | `/auth/logout` | Authenticated | Revoke the current session |
| POST | `/auth/forgot-password` | Public | Queue password reset instructions without disclosing account existence |
| POST | `/auth/reset-password` | Public | Change the password with a single-use token and revoke sessions |

Login is a two-step flow. Submit `{ "identifier": "user@example.com", "password": "..." }` (a username also works) to `/auth/login`. Only verified, active accounts with valid credentials receive a code. This stage returns `{ "challengeToken": "...", "email": "user@example.com" }` and does not create a session or set auth cookies.

Submit `{ "challengeToken": "...", "code": "123456" }` to `/auth/login/otp/verify`. The signed challenge is bound to the account and issued code; email-only requests and verification without a challenge are rejected. Codes expire after 10 minutes, are single-use, and allow at most five failed attempts. Credential submissions within 60 seconds reuse the current code. Both credential routes and code verification are rate-limited.

Successful verification returns an `accessToken`, `refreshToken`, `expiresAt`, and user summary. The web proxy stores tokens in HTTP-only cookies only after verification. Refresh tokens are hashed and rotated on use. Set `JWT_ACCESS_TOKEN_TTL=1h` as shown in `.env.example` and restart the API to use one-hour access tokens; automatic refresh remains enabled with the unchanged seven-day refresh-token lifetime.

## Profiles, contacts, and settings

| Method | Route | Purpose |
| --- | --- | --- |
| GET / PATCH | `/users/me` | Read or update the signed-in profile |
| GET | `/users/search?q=&page=&limit=` | Search visible users |
| GET | `/users/:userId` | Read a profile subject to visibility and block settings |
| GET / POST | `/contacts` | List or add contacts |
| PATCH / DELETE | `/contacts/:contactUserId` | Rename or remove a contact |
| GET / POST | `/blocked-users` | List or block a user |
| DELETE | `/blocked-users/:userId` | Unblock a user |
| GET / PATCH | `/user-settings` | Read or update signed-in user preferences |
| GET / POST | `/user-devices` | List or register devices |
| PATCH / DELETE | `/user-devices/:deviceId` | Update or revoke a device and its sessions |
| GET | `/user-sessions` | List active sessions for the signed-in user |
| DELETE | `/user-sessions/:sessionId` | Revoke one session |
| DELETE | `/user-sessions/others` | Revoke all sessions except the current one |

## Conversations and membership

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/conversations?page=&limit=&q=&archived=&starred=` | List active memberships with last-message previews; server-side name/participant search and optional `true` filters |
| GET / PATCH / DELETE | `/conversations/:conversationId` | Read, update, or leave a conversation (private chats are archived); either private participant may change the disappearing timer, other updates require an admin |
| DELETE | `/conversations/:conversationId/everyone` | Remove the chat and all history for everyone; private participants or group admins only |
| POST / DELETE | `/conversations/:conversationId/archive` | Archive or unarchive the current membership |
| POST / DELETE | `/conversations/:conversationId/star` | Star or unstar the current membership |
| POST / GET | `/private-conversations` and `/private-conversations/:conversationId` | Create or read a one-to-one conversation |
| POST | `/private-conversations/saved` | Open or create the authenticated user's Saved Messages chat |
| GET / POST | `/groups` | List or create groups |
| GET / PATCH / DELETE | `/groups/:conversationId` | Read, update, or remove a group |
| GET / POST | `/communities` | List or create communities |
| GET / PATCH / DELETE | `/communities/:communityId` | Read, update, or remove a community |
| GET / POST | `/conversation-members/:conversationId` | List or add members |
| PATCH / DELETE | `/conversation-members/:conversationId/:userId` | Update or remove a member |

Group/community creation makes the creator an admin. Membership and admin checks are enforced at the API boundary.

Saved Messages is a private conversation with exactly one member and a self-pair in the existing unique private-pair mapping. Concurrent opens resolve to the same conversation. It accepts text, attachments, voice notes, replies and pins using the normal message endpoints; it does not copy other people's messages automatically. Opening it restores the owner's membership and unarchives it. Other accounts cannot read it or add members. Conversation lists and details include `is_saved` for its localized title. Deleting this chat uses normal whole-chat deletion; opening Saved Messages again starts an empty chat. No new migration is needed.

The chat-preferences dialog offers Off, 24-hour, 7-day and 90-day disappearing-message timers. Group/community admins and either private-chat participant may update `disappearing_message_ttl_seconds` (null disables it). Changes emit `conversation:updated` and affect only messages sent afterward. The API reads the timer inside the message transaction after locking the conversation and applies it to text and attachment sends. An explicit `expires_at` can shorten, but cannot extend, the conversation timer. Expired messages and attachments become inaccessible through the existing visibility rules; this feature is not a physical purge of database records, stored files, backups, or downloaded copies. Clients remove loaded expired messages, pins, replies, previews and notifications, and refresh conversation previews.

Chat notification preferences persist through `PATCH /conversation-members/:conversationId/:userId` using `notification_policy: "all" | "mentions_only" | "none"`. Group composers provide a searchable @member picker. Mentions are matched case-insensitively against active recipient usernames in the conversation, with token boundaries and escaped punctuation, for text sends only. `mentions_only` recipients receive alerts only when mentioned; `none`, an active `muted_until`, and disabled account notifications suppress alerts. Mentions never bypass membership, blocks, account notification settings, or a timed mute. Editing a message does not send new mention alerts. Unread counts and message delivery are unchanged by notification preferences.

Conversation search `q` is trimmed and limited to 100 characters. It matches conversation names or other active participants' names/usernames case-insensitively, within the current membership/archive/star filters. Pagination returns `data`, `page`, `limit`, `total`, and `totalPages`, ordered by latest-message time (empty chats last), creation time, then ID. The web client loads additional pages rather than limiting access to the first 50 conversations.

## Messages and conversation features

Conversation lists include `unread_count` per membership, excluding own, deleted, expired, pre-membership, and already-read messages. Counts use `last_read_message_id`, independent of read-receipt sharing. List and detail member users include `presence: "online" | "offline" | null` for private-chat peers. `null` means privacy-hidden or unavailable, not offline. Presence honors the subject's `online_visibility` and blocks in either direction, and requires a connected socket with a valid user/device session. For `contacts` visibility, a contact saved in either direction qualifies both peers to see each other's status; `nobody` continues to hide the subject's status regardless of contacts.

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/messages?conversationId=&cursor=&limit=` | Read a cursor-paginated message history |
| GET | `/messages/search?q=&conversationId=&sender=&from=&to=&attachmentType=&page=&limit=` | Search active messages in conversations the user belongs to; `q` is 2–100 characters, `sender` matches name or username, dates are inclusive ISO timestamps, and attachment type is image/video/audio/document |
| POST | `/messages` | Send a message (supports replies and expiration) |
| GET / PATCH / DELETE | `/messages/:messageId` | Read, edit own text within 15 minutes, or delete as sender/admin; DELETE accepts `scope=me` or `scope=everyone` (default) |
| GET / POST / DELETE | `/message-reactions/:messageId` | List, add/change, or remove the current user's reaction |
| GET | `/message-receipts?conversationId=` | Read receipts for the current user's sent messages |
| POST / PATCH | `/message-receipts/:messageId/delivered` and `/read` | Record delivery/read status |
| GET | `/pinned-messages?conversationId=` | List pinned messages |
| POST / DELETE | `/pinned-messages` and `/pinned-messages/:messageId` | Pin or unpin a message |
| GET | `/message-attachments?messageId=` | List attachment metadata |
| POST | `/message-attachments/conversations/:conversationId/upload` | Store one supported file and atomically create its message/attachment before publishing events (multipart `file`, 1 byte–20 MB); returns the created message |
| POST | `/message-attachments/upload/:messageId` | Upload one supported file (multipart field `file`, maximum 20 MB) |
| GET | `/message-attachments/:attachmentId/file` | Download an attachment |
| DELETE | `/message-attachments/:attachmentId` | Remove an attachment |

Uploads currently use the local filesystem under `UPLOAD_DIR` (default: repository-root `uploads`). Download responses stream the file directly rather than using the JSON response envelope. Use durable object storage before deploying multiple API instances or relying on local disk persistence.

Message history and direct reads include `reply`, a minimal `{id, type, content, sender: {id, name}}` preview or null. Originals hidden for the viewer, expired, deleted or no longer accessible are omitted. `reply_to_id` is validated within the same conversation for sending text or attachments. Upload-and-send accepts the optional multipart `reply_to_id` UUID. The first history page also includes `firstUnreadId`, computed from the member's read cursor and join date, not receipt visibility; subsequent pages omit it. History ordering includes ID as a timestamp tie-breaker.

Pins retain the existing member-level permissions: active members may pin or unpin. Changes emit `message:pinned` with `id` and `conversation_id`. Reactions remain one emoji per user/message, replaced by POST or removed by DELETE; reaction updates emit `message:reaction`.

The upload-and-send route derives the message type from the accepted MIME type and uses the sanitized filename as content. It applies the normal membership/block checks and creates the message, attachment metadata, receipts and preview together in the message transaction after file storage succeeds. Failures before commit clean up the new file and publish no message events. Once committed, realtime errors do not remove the file backing a saved message. The legacy upload-to-existing-message route retains its original behavior; the web composer no longer creates messages before uploading.

Voice notes use the same audio attachment flow. The browser records WebM, MP4, or Ogg depending on `MediaRecorder` support, with a five-minute recording cap and a preview before sending. Microphone access requires HTTPS or localhost. Recipients can load an authenticated audio attachment into the in-chat player or download it; playback support depends on the browser's audio codecs.

`DELETE /messages/:messageId?scope=me` persists a `hidden_messages` record for the authenticated member. The message is excluded from that account's history, direct reads, search, pins, previews, attachment reads and unread counts, but remains visible to other members. Only that account's sockets receive `message:deleted`. `scope=everyone` preserves sender/group-admin permissions and permanently deletes the message row, cascading receipts, reactions, pins, attachments and hiding records. Reply references become null. Stored attachment/thumbnail files are unlinked; missing files are already considered removed. Other file errors fail the request, retaining a redacted tombstone and file references for retrying the same DELETE. Read cursors are moved to the immediate predecessor, and the conversation's latest-message fields are recomputed. Deletion is broadcast after redaction and again after successful cleanup. This does not erase backups or previously downloaded copies. Whole-chat deletion retains its separate soft-deletion behavior. PATCH accepts nonblank text up to 10,000 characters; ownership, text type and the strict less-than-15-minute deadline are checked by the API, not just the UI.

Whole-chat deletion soft-deletes the conversation and clears message contents/metadata; members can no longer read or send messages or download its attachments. Membership rows remain for deletion-event delivery. The private pair mapping is removed so starting another chat creates an empty conversation. File bytes and soft-deleted records are retained; this is not physical storage erasure. Apply migration `20261117110000_add_hidden_messages` and regenerate Prisma before deploying this API.

The web app's same-origin `/api/auth/login`, `/api/auth/logout`, and `/api/messages/search` handlers keep API access and refresh tokens in HTTP-only cookies. Configure `API_BASE_URL` for the server-side API origin; the default is `http://localhost:3001/api/v1`.

## Calls

| Method | Route | Purpose |
| --- | --- | --- |
| GET / POST | `/calls` | List participating calls or start an audio/video call |
| GET / PATCH | `/calls/:callId` | Read a call or accept/reject/end it |
| GET | `/call-participants/:callId` | List call participants |
| POST / PATCH | `/call-participants/:callId/join` and `/leave` | Join or leave a call |

## Socket.IO

Clients may emit `conversation:typing` with `{conversation_id, typing}` and an acknowledgement callback receiving `{ok}`. The API validates the payload and current session/membership, checks blocks for private peers, and emits `{conversation_id, user_id, typing}` only to other active members' user rooms. Socket handlers use handshake identity and current session checks rather than HTTP bearer headers; their acknowledgements are not wrapped in the HTTP response envelope. The gateway bypasses the HTTP throttler and uses its per-socket typing throttle, and gateway exceptions use the WebSocket exception filter. Duplicate updates are throttled per socket; start/stop transitions are delivered immediately. No typed text is transmitted. Clients expire typing state after six seconds without renewal and clear it on disconnect. Rejected events are logged and acknowledged with `ok: false`. Missing or invalid acknowledgements surface an error after five seconds and allow a later typing update to retry.

The web app obtains a 60-second, socket-only connection ticket through authenticated `POST /realtime/session` (proxied by `/api/backend/realtime/session`). Connect to the API Socket.IO server with the ticket as `auth.token`. HTTP API access tokens are also accepted for non-browser clients; socket tickets cannot authenticate HTTP API requests. Each reconnect obtains a fresh ticket. The server uses Redis for its Socket.IO adapter.

The web proxy returns the browser-reachable Socket.IO origin from `REALTIME_URL`, falling back to the origin of `API_BASE_URL`. Set `REALTIME_URL` when the internal API hostname is not browser-reachable. Use HTTPS/WSS in production, expose `/socket.io/` with WebSocket upgrades, and include the web origin in API `CORS_ORIGINS` (or `WEB_URL`).

Authenticated sockets automatically join their user room. Message changes, receipts, reactions, attachment changes, and call updates are broadcast to active conversation members' user rooms, so an open conversation subscription is not required. New private conversations emit `conversation:updated`. On reconnect the web app refetches conversations and open messages to recover missed events; polling remains a fallback.

Client events:

- `conversation:join` / `conversation:leave` with `{ "conversationId": "..." }`
- `call:signal` with `{ "callId": "...", "targetUserId": "...", "type": "offer|answer|ice-candidate", "payload": ... }`

Server events include `conversation:updated`, `message:created`, `message:updated`, `message:deleted`, `message:attachment`, `message:reaction`, `message:receipt`, `call:incoming`, `call:updated`, and relayed `call:signal`. Conversation-scoped events include `conversation_id`.

The payload-less `presence:updated` event invalidates list/detail presence snapshots when a peer connects or disconnects. It is sent only to privacy-authorized private-chat peers. Snapshots check all connected sessions across the Redis adapter, so closing one tab does not mark a user offline while another remains connected. Clients also poll to recover from missed events, privacy changes, and session expiry.

`message:updated` and `message:deleted` include `id` and `conversation_id`. Clients refresh history/previews and remove stale message alerts. `conversation:deleted` includes `conversation_id` and reaches all active members; clients evict that chat's cached detail/history, remove its alerts and navigate away if it is open.

`message:notification` is sent separately to recipients with account notifications enabled, no active mute, and conversation policy `all`. `none` and `mentions_only` suppress generic alerts; mention detection is not implemented. Notification preferences never suppress message delivery. The web app shows in-app alerts outside the visible conversation and browser alerts for hidden tabs after the user grants permission in notification settings. Closed-browser/offline Web Push delivery is not implemented.

Receiving a live message acknowledges delivery. Visible conversation messages are marked read through the receipt API; sender check marks update from receipt events. Read-receipt opt-out is enforced by the API.

## Health

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | Public | Liveness |
| GET | `/health/ready` | Public | PostgreSQL and Redis readiness |
