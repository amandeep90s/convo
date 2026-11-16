# API reference

The HTTP API is prefixed with `/api/v1`. Successful JSON responses use the standard envelope; errors use the API error envelope. All routes below require a bearer access token unless marked **Public**. Identifiers are UUIDs.

Interactive Swagger documentation is available at `/api/v1/docs`. Request bodies and DTO-based query parameters are generated from the shared Zod schemas. Successful responses show the standard response envelope, authenticated operations use the `access-token` bearer scheme, and file upload/download operations document their binary payloads.

## Authentication

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/register` | Public | Register and queue an email verification message |
| POST | `/auth/verify-email` | Public | Verify an email token |
| POST | `/auth/resend-verification` | Public | Resend verification instructions |
| POST | `/auth/login` | Public | Check credentials and create a device/session |
| POST | `/auth/login/otp/request` | Public | Request an email login code without disclosing account existence |
| POST | `/auth/login/otp/verify` | Public | Verify an email login code and create a device/session |
| POST | `/auth/refresh` | Public | Rotate a refresh token and issue a new access token |
| POST | `/auth/logout` | Authenticated | Revoke the current session |
| POST | `/auth/forgot-password` | Public | Queue password reset instructions without disclosing account existence |
| POST | `/auth/reset-password` | Public | Change the password with a single-use token and revoke sessions |

Login returns an `accessToken`, `refreshToken`, `expiresAt`, and user summary. Refresh tokens are stored as hashes and rotated on use.

Request a login code with `{ "email": "user@example.com" }`. Verified, active accounts receive a six-digit code by email; it expires after 10 minutes, can be used once, and allows at most five failed attempts. The request response is the same whether or not an eligible account exists. Verify with `{ "email": "user@example.com", "code": "123456" }`; success returns the normal login session. Both OTP endpoints are rate-limited.

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
| GET | `/conversations?page=&limit=&archived=&starred=` | List active memberships with last-message previews; optional `true` filters |
| GET / PATCH / DELETE | `/conversations/:conversationId` | Read, admin-update, or leave a conversation (private chats are archived) |
| POST / DELETE | `/conversations/:conversationId/archive` | Archive or unarchive the current membership |
| POST / DELETE | `/conversations/:conversationId/star` | Star or unstar the current membership |
| POST / GET | `/private-conversations` and `/private-conversations/:conversationId` | Create or read a one-to-one conversation |
| GET / POST | `/groups` | List or create groups |
| GET / PATCH / DELETE | `/groups/:conversationId` | Read, update, or remove a group |
| GET / POST | `/communities` | List or create communities |
| GET / PATCH / DELETE | `/communities/:communityId` | Read, update, or remove a community |
| GET / POST | `/conversation-members/:conversationId` | List or add members |
| PATCH / DELETE | `/conversation-members/:conversationId/:userId` | Update or remove a member |

Group/community creation makes the creator an admin. Membership and admin checks are enforced at the API boundary.

## Messages and conversation features

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/messages?conversationId=&cursor=&limit=` | Read a cursor-paginated message history |
| GET | `/messages/search?q=&conversationId=&sender=&from=&to=&attachmentType=&page=&limit=` | Search active messages in conversations the user belongs to; `q` is 2–100 characters, `sender` matches name or username, dates are inclusive ISO timestamps, and attachment type is image/video/audio/document |
| POST | `/messages` | Send a message (supports replies and expiration) |
| GET / PATCH / DELETE | `/messages/:messageId` | Read, edit as sender, or delete as sender/admin |
| GET / POST / DELETE | `/message-reactions/:messageId` | List, add/change, or remove the current user's reaction |
| GET | `/message-receipts?conversationId=` | Read receipts for the current user's sent messages |
| POST / PATCH | `/message-receipts/:messageId/delivered` and `/read` | Record delivery/read status |
| GET | `/pinned-messages?conversationId=` | List pinned messages |
| POST / DELETE | `/pinned-messages` and `/pinned-messages/:messageId` | Pin or unpin a message |
| GET | `/message-attachments?messageId=` | List attachment metadata |
| POST | `/message-attachments/upload/:messageId` | Upload one supported file (multipart field `file`, maximum 20 MB) |
| GET | `/message-attachments/:attachmentId/file` | Download an attachment |
| DELETE | `/message-attachments/:attachmentId` | Remove an attachment |

Uploads currently use the local filesystem under `UPLOAD_DIR` (default: repository-root `uploads`). Download responses stream the file directly rather than using the JSON response envelope. Use durable object storage before deploying multiple API instances or relying on local disk persistence.

The web app's same-origin `/api/auth/login`, `/api/auth/logout`, and `/api/messages/search` handlers keep API access and refresh tokens in HTTP-only cookies. Configure `API_BASE_URL` for the server-side API origin; the default is `http://localhost:3001/api/v1`.

## Calls

| Method | Route | Purpose |
| --- | --- | --- |
| GET / POST | `/calls` | List participating calls or start an audio/video call |
| GET / PATCH | `/calls/:callId` | Read a call or accept/reject/end it |
| GET | `/call-participants/:callId` | List call participants |
| POST / PATCH | `/call-participants/:callId/join` and `/leave` | Join or leave a call |

## Socket.IO

Connect to the API Socket.IO server with the access token as `auth.token` (or an `Authorization: Bearer ...` header). The server uses Redis for its Socket.IO adapter.

Client events:

- `conversation:join` / `conversation:leave` with `{ "conversationId": "..." }`
- `call:signal` with `{ "callId": "...", "targetUserId": "...", "type": "offer|answer|ice-candidate", "payload": ... }`

Server events include `message:created`, `message:updated`, `message:deleted`, `message:reaction`, `message:receipt`, `call:incoming`, `call:updated`, and relayed `call:signal`.

## Health

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | Public | Liveness |
| GET | `/health/ready` | Public | PostgreSQL and Redis readiness |
