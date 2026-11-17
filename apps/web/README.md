# Convo web client

The web client is the Next.js application in this workspace. The repository-level [README](../../README.md) contains setup, environment, database, and workspace commands. See the [product scope and development plan](../../docs/project-scope.md) for current UI status and planned work.

Run the client from the repository root with:

```bash
pnpm --dir apps/web dev
```

The client uses the shared workspace packages; install dependencies from the repository root, not from this directory.

## Live messages

The private app connects directly to the API's Socket.IO server using a short-lived socket-only ticket obtained through the authenticated Next.js proxy. Set server-side `REALTIME_URL` to the browser-reachable API origin when it differs from the origin of `API_BASE_URL`. The API must allow the web origin through `CORS_ORIGINS` or `WEB_URL`; production proxies must forward WebSocket upgrades for `/socket.io/`.

Incoming events refresh conversations, messages, attachments, and receipt indicators. Reconnects refetch current data, with polling as a fallback. Notification settings include an explicit browser-permission button. In-app alerts and permitted hidden-tab browser notifications work while the app is running; notifications after the browser is closed require a future Web Push implementation.

The API's `tests/realtime.spec.ts` exercises two authenticated sockets against PostgreSQL and Redis, including recipients outside the active chat, notification preferences, attachment completion, and receipts. Build the API before running its existing Playwright test command. The web tests additionally simulate Socket.IO events to verify live list/chat updates, notification suppression in the active chat, receipt indicators, and reconnects.
