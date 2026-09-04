# Convo

Convo is a monorepo for a real-time messaging application. It contains a Next.js web client, a NestJS API, a Prisma/PostgreSQL database package, and shared TypeScript contracts.

## Requirements

- Node.js `20.19.0` or newer
- pnpm `11.25.0` or newer
- PostgreSQL
- Docker Desktop (optional, for local PostgreSQL and Redis)

Install dependencies from the repository root:

```bash
pnpm install
```

Set `DATABASE_URL` in `packages/database/.env` before running database commands or the API.

To run PostgreSQL and Redis without using the default host ports, start the Docker services:

```bash
docker compose up -d
```

The services use host ports `55432` for PostgreSQL and `56379` for Redis. Configure the API and Prisma package with:

```dotenv
DATABASE_URL=postgresql://postgres:Aman@1234@localhost:55432/convo_app?schema=public
REDIS_HOST=localhost
REDIS_PORT=56379
```

Stop the services with `docker compose down`. Add `-v` only when you also want to remove the persisted database and Redis data.

See [docs/docker.md](docs/docker.md) for the full list of Docker commands, including how to view logs and connect to the running PostgreSQL and Redis instances.

## Repository Structure

```text
apps/
  api/       NestJS backend, listening on port 3001 by default
  web/       Next.js frontend, listening on port 3000
packages/
  database/  Prisma schema, migrations, and generated client
  shared/    Shared enums, schemas, and TypeScript types
  eslint-config/
  typescript-config/
docs/
  database/  Database table documentation
```

## Development

Start the web app and API together:

```bash
pnpm dev
```

Open the web app at [http://localhost:3000](http://localhost:3000). The API listens at [http://localhost:3001](http://localhost:3001), unless `PORT` is set.

Run one application independently:

```bash
pnpm --dir apps/web dev
pnpm --dir apps/api dev
```

## Database

The Prisma schema is in `packages/database/prisma/schema.prisma`. Common database commands are:

```bash
pnpm --dir packages/database db:generate
pnpm --dir packages/database db:validate
pnpm --dir packages/database db:migrate
pnpm --dir packages/database db:migrate:status
pnpm --dir packages/database db:studio
```

See the [database documentation](docs/database/README.md) for the table index and schema documentation.

## Quality Checks

Run the checks for the whole workspace:

```bash
pnpm lint
pnpm check-types
pnpm format:check
```

Apply lint fixes or formatting when needed:

```bash
pnpm lint:fix
pnpm format
```

## Tests

The API and web applications use Playwright for end-to-end tests:

```bash
pnpm --dir apps/api test:e2e
pnpm --dir apps/web test:e2e
```

## Build

Build all applications and packages:

```bash
pnpm build
```

Build or check a specific workspace package with a filter:

```bash
pnpm turbo build --filter=web
pnpm turbo check-types --filter=api
```
