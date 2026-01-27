# D1 Database Migrations

This directory contains SQL migration files for Cloudflare D1.

## Generating Migrations

When you make changes to `prisma/schema.prisma`, generate a migration SQL file:

```bash
# Generate migration SQL from schema changes
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > migrations/$(date +%Y%m%d%H%M%S)_migration.sql
```

Or to generate a diff from your current database:

```bash
npx prisma migrate diff \
  --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma \
  --script > migrations/$(date +%Y%m%d%H%M%S)_migration.sql
```

## Applying Migrations

Apply migrations to your D1 database:

```bash
# Apply a specific migration
npx wrangler d1 execute bjjh-cleaning-db --file=./migrations/MIGRATION_FILE.sql

# Or apply all migrations (requires custom script)
for file in migrations/*.sql; do
  npx wrangler d1 execute bjjh-cleaning-db --file="$file"
done
```

## Initial Schema

The initial schema can be generated from the Prisma schema:

```bash
DATABASE_URL="file:./dev.db" npx prisma db push
```

This creates a local SQLite database that you can use for development.
