# Docker Services

The `docker-compose.yml` at the repository root runs local PostgreSQL and Redis instances for development. Both services expose non-default host ports so they don't collide with any services already running on your machine.

| Service    | Container name   | Image                | Host port | Container port |
| ---------- | ---------------- | -------------------- | --------- | -------------- |
| PostgreSQL | `convo-postgres` | `postgres:17-alpine` | `55432`   | `5432`         |
| Redis      | `convo-redis`    | `redis:7-alpine`     | `56379`   | `6379`         |

Data is persisted in the named volumes `convo-postgres-data` and `convo-redis-data`.

## Starting and stopping

Run all commands from the repository root (where `docker-compose.yml` lives).

```bash
# Start both services in the background
docker compose up -d

# Start only one service
docker compose up -d postgres
docker compose up -d redis

# Stop the services (containers removed, volumes kept)
docker compose down

# Stop and delete persisted data too (drops the database and cache)
docker compose down -v

# Stop containers without removing them (can be resumed with `docker compose start`)
docker compose stop
docker compose start

# Restart a service (e.g. after changing environment variables)
docker compose restart postgres
```

## Checking status and logs

```bash
# List running services and their health status
docker compose ps

# Follow logs for both services
docker compose logs -f

# Follow logs for a single service
docker compose logs -f postgres
docker compose logs -f redis
```

## Accessing PostgreSQL

Connect with `psql` inside the running container:

```bash
docker exec -it convo-postgres psql -U postgres -d convo_app
```

Or connect from the host using any PostgreSQL client with:

```bash
Host:     localhost
Port:     55432
User:     postgres
Password: Aman@1234
Database: convo_app
```

Connection string (used by `packages/database/.env` and the API):

```bash
DATABASE_URL=postgresql://postgres:Aman@1234@localhost:55432/convo_app?schema=public
```

## Accessing Redis

Connect with `redis-cli` inside the running container:

```bash
docker exec -it convo-redis redis-cli
```

Or connect from the host with `redis-cli` installed locally:

```bash
redis-cli -h localhost -p 56379
```

Environment variables used by the API (see `apps/api/.env`):

```bash
REDIS_HOST=localhost
REDIS_PORT=56379
```

## Resetting local data

To wipe the database and cache and start fresh:

```bash
docker compose down -v
docker compose up -d
```

You will need to re-run Prisma migrations afterwards (see `packages/database`).
