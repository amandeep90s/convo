# Convo: product scope and development plan

## What the app is

Convo is intended to be a real-time messaging application. The monorepo contains:

- A Next.js web client with routes planned for authentication, chats, contacts, communities, calls, search, invites, and account settings.
- A NestJS API with PostgreSQL persistence through Prisma, Redis for health checks and background mail work, and shared Zod schemas/types.
- Shared database models for users, sessions/devices, contacts, conversations/groups, messages and attachments, reactions, receipts, pins, invites, calls, and settings.

The schemas and routes describe the implemented API breadth; they do not mean every feature is wired into the UI or production-ready.

## Current implementation

### UI

- The home route includes product context and sign-in/register entry points. Register, email verification, password recovery, password login, and email OTP login use the same-origin auth routes.
- Access and refresh credentials are held in HTTP-only cookies. Protected app routes require a session cookie; authenticated API traffic passes through the same-origin BFF, which refreshes and retries expired access tokens.
- The responsive app shell provides navigation and sign-out. Chats include paginated conversation lists, archive/star actions, message history, text sending, and supported attachment upload/download. Contacts support people search, adding/removing contacts, and starting private conversations.
- Group chats can be created and admins can add members. Communities can be created and viewed; admins can create invite links and signed-in users can join from an invite. Calls show session history and state controls, but the web client does not yet provide audio/video media transport.
- Profile, account, privacy, notification, chat, appearance, language, security-session, and device screens use available API operations. Storage and media pages disclose API/UI limitations rather than presenting unsupported controls.
- Message search is protected by the app layout and remains filterable by sender, date range, and attachment type. The Playwright suite covers the landing page, guest redirect, conversation loading/text sending, and search form/results; auth and attachment flows still need broader coverage.

### API and data

- API routes cover auth/session lifecycle, profiles, contacts/blocks, conversations/private chats, groups/communities/membership/invites, messages/interactions/attachments, calls/participants, settings, devices, and sessions. See the [API reference](api.md).
- Message search is available through the web UI and API, with sender, date-range, and attachment-type filters. Browser tokens are held in HTTP-only same-site cookies through same-origin routes.
- JWT access tokens are checked against active database sessions on each HTTP request; refresh tokens rotate and are stored hashed.
- A Socket.IO gateway authenticates the same access tokens, gates conversation rooms by membership, relays call signaling, and uses the configured Redis adapter.
- Message files currently use local disk storage and are limited to supported MIME types and 20 MB; production multi-instance deployment still needs object storage.
- The API Playwright suite has health and authentication-boundary smoke tests. Database-backed workflows and feature-level integration tests still need expanding.
- Readiness (`/api/v1/health/ready`) depends on both PostgreSQL and Redis being reachable.

## Development plan

Prioritize vertical, testable user flows rather than building every screen or endpoint independently.

### Remaining UI work

1. **Realtime experience**
   - Add a scoped realtime credential flow or another safe Socket.IO authentication approach; do not expose long-lived access tokens to browser JavaScript.
   - Subscribe to incoming messages, call state, presence, and read/delivery updates rather than relying on message polling.
2. **Messaging features**
   - Add reactions, replies, pins, message editing/deletion controls, read receipts, and richer attachment previews.
   - Add community discovery and moderation/member-removal controls.
3. **Calls**
   - Implement and test audio/video media transport before presenting the existing call-session endpoints as a complete calling experience.
4. **Account capability gaps**
   - Add a storage usage/cleanup API before building storage controls; add email-change, device-enrollment, and notification-delivery flows if product requirements call for them.
5. **UI validation**
   - Add end-to-end coverage for auth, the primary chat and attachment flows, contacts, invite joining, settings persistence, and major API failure/empty states; add responsive and accessibility checks.

### API work

1. **API workflow coverage**
   - Add database-backed tests for registration/login/refresh/logout/password reset, private/group messaging, membership permissions, attachment upload, invite usage limits, and call state transitions.
   - Add contract tests for pagination, message-search filters, errors, message expiration, profile privacy, and read-receipt preferences.
2. **Realtime presence and delivery**
   - Complete presence subscriptions and delivery guarantees; test reconnects and multi-instance behavior.
3. **Production file storage**
   - Replace local uploads with durable object storage and signed access appropriate to the deployment.
4. **Additional auth integrations**
   - Add OAuth providers once callback/session contracts and required packages are selected.
5. **Operational readiness**
   - Add migration checks, deployment configuration for secrets/CORS/mail/PostgreSQL/Redis, and production monitoring.

## Running on another machine

From the repository root:

1. Install Node.js `20.19.0+` (Node 22 is the CI version) and pnpm `12.3.4`.
2. Copy `.env.example` to `.env`; set a strong local `JWT_SECRET` and matching PostgreSQL password. Configure Resend and Google OAuth credentials when testing those integrations.
3. Run `corepack enable`, then `pnpm install --frozen-lockfile`. The lockfile is committed; no package installation step should change dependency versions.
4. Start local PostgreSQL and Redis with `docker compose up -d`.
5. Apply the database migration with `pnpm --dir packages/database db:migrate`.
6. Start both apps with `pnpm dev`. The web app is at `http://localhost:3000`; the API is at `http://localhost:3001/api/v1`.

The root `README.md` documents the workspace commands and quality checks. No additional dependencies are currently needed beyond those already declared in the workspace manifests and lockfile.
