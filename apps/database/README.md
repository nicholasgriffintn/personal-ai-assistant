# Database

The database management app for the Personal Assistant project, using Drizzle ORM with Cloudflare D1 database.

## Features

- Schema definitions for all project data models
- Database migrations management
- Type-safe database access with Drizzle ORM
- Integration with Cloudflare D1

## Setup

1. Install dependencies
```bash
pnpm install
```

2. Configure your wrangler.jsonc file for D1 database
```bash
cp wrangler.jsonc.example wrangler.jsonc
```

## Managing Migrations

### Generate migrations

To generate a new migration after schema changes:

```bash
pnpm run generate
```

### Apply migrations

To apply migrations to different environments:

```bash
# Migrate local database
pnpm run db:migrate:local

# Migrate preview database
pnpm run db:migrate:preview

# Migrate production database
pnpm run db:migrate:prod
```

## Usage in Other Apps

Other apps in the monorepo can import and use the database schema:

```typescript
import { db, schema } from '@personal-assistant/database';

// Query the database
const users = await db.select().from(schema.users);
```