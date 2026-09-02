# Convo

Convo is a monorepo for a real-time messaging application. It contains a Next.js web client, a NestJS API, a Prisma/PostgreSQL database package, and shared TypeScript contracts.

## Requirements

- Node.js `20.19.0` or newer
- pnpm `11.25.0` or newer
- PostgreSQL

Install dependencies from the repository root:

```bash
pnpm install
```

Set `DATABASE_URL` in `packages/database/.env` before running database commands or the API.

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
