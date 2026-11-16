# Convo API

The API is the NestJS application in this workspace. The repository-level [README](../../README.md) contains setup, environment, database, and workspace commands. See the [API reference](../../docs/api.md) for the HTTP and Socket.IO routes, and the [product scope and development plan](../../docs/project-scope.md) for remaining product work.

Run the API from the repository root with:

```bash
pnpm --dir apps/api dev
```

The API uses the shared workspace packages and requires the root `.env`, PostgreSQL, and Redis. Install dependencies from the repository root.
