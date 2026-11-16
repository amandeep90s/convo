# Convo: product scope and development plan

## What the app is

Convo is intended to be a real-time messaging application. The monorepo contains:

- A Next.js web client with routes planned for authentication, chats, contacts, communities, calls, search, invites, and account settings.
- A NestJS API with PostgreSQL persistence through Prisma, Redis for health checks and background mail work, and shared Zod schemas/types.
- Shared database models for users, sessions/devices, contacts, conversations/groups, messages and attachments, reactions, receipts, pins, invites, calls, and settings.

The schemas and routes describe the implemented API breadth; they do not mean every feature is wired into the UI or production-ready.

## Current implementation

### UI

- The home route renders the translated app title and theme/language toggles.
- The app/auth route structure and many settings, chat, contact, call, and community pages exist.
- Most of those pages still return placeholder content. There is no complete sign-in-to-chat user flow or visible app shell yet.
- The web Playwright suite currently has a single home-page smoke test.

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

### UI work

1. **Authentication and app shell**
   - Build usable register, email verification, and recovery forms.
   - Connect them to the API, handle validation/loading/error/success states, and establish protected routes and broader session handling.
   - Add the signed-in navigation/layout shared by chats, contacts, calls, and settings.
2. **Core messaging**
   - Build the conversation list, direct conversation view, message composer, history loading, and empty/loading/error states.
   - Integrate contacts and message delivery/read state; make the layout responsive and keyboard accessible.
3. **Additional messaging features**
   - Wire group/community creation and membership, invites, reactions, replies, pins, attachments, archive/starred views, and call experiences to the available API.
4. **Account preferences**
   - Connect profile, privacy, security, devices, notification, appearance, language, storage, and chat settings to persisted API settings.
5. **UI validation**
   - Add focused end-to-end coverage for signup/login, the primary chat flow, and major failure/empty states, plus responsive and accessibility checks.

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
