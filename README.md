# BJJH Cleaning
## 濱江實中 掃區評比系統

A cleaning area evaluation system for Hamjiang Experimental High School.

## Tech Stack

- **Framework**: Next.js 15.5.9 with React 19
- **Database**: Drizzle ORM with SQLite/D1
- **Authentication**: NextAuth with Google OAuth
- **Storage**: Cloudflare R2 or MinIO (S3-compatible)
- **Deployment**: Cloudflare Pages + Workers (via OpenNext.js)

## Deployment Options

This application can be deployed in multiple ways:

### 1. Cloudflare Pages with Workers and D1 (Recommended for Production)

This deployment method uses Cloudflare's serverless infrastructure:
- **Cloudflare Pages** for hosting the Next.js application via OpenNext.js
- **Cloudflare D1** for the SQLite database via Drizzle ORM
- **Cloudflare R2** for file storage
- **Cloudflare Workers** for server-side logic

#### Prerequisites
- [Cloudflare account](https://dash.cloudflare.com/sign-up)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed
- Node.js 18+ and Yarn

#### Setup Steps

1. **Install dependencies**
   ```bash
   yarn install
   ```

2. **Login to Cloudflare**
   ```bash
   npx wrangler login
   ```

3. **Create D1 Database**
   ```bash
   yarn cf:d1:create
   ```
   Copy the `database_id` from the output and update `wrangler.jsonc`:
   ```jsonc
   "d1_databases": [
     {
       "binding": "DB",
       "database_name": "bjjh-cleaning-db",
       "database_id": "YOUR_DATABASE_ID_HERE"
     }
   ]
   ```

4. **Create R2 Bucket**
   ```bash
   yarn cf:r2:create
   ```

5. **Generate Drizzle schema and migrations**
   ```bash
   # Generate migrations
   yarn db:generate
   ```

6. **Run database migrations**
   
   Push schema to local database for testing:
   ```bash
   DATABASE_URL="file:./dev.db" yarn db:push
   ```
   
   Then apply migrations to D1:
   ```bash
   # Apply to remote D1 database
   yarn cf:d1:migrate
   ```

7. **Set environment secrets**
   ```bash
   npx wrangler secret put AUTH_SECRET
   npx wrangler secret put AUTH_GOOGLE_CLIENT_ID
   npx wrangler secret put AUTH_GOOGLE_CLIENT_SECRET
   ```

8. **Build for Cloudflare Pages**
   ```bash
   yarn build
   yarn pages:build
   ```

9. **Deploy to Cloudflare Pages**
   ```bash
   yarn pages:deploy
   ```
   
   Or connect your GitHub repository to Cloudflare Pages for automatic deployments.

#### Local Development with Cloudflare Workers

To test with Cloudflare Workers locally:
```bash
yarn build
yarn pages:build
yarn pages:dev
```

### 2. Docker Deployment (Alternative)

For traditional Docker-based deployment, see the `Dockerfile` and `docker-compose.yml` in the repository.

## Environment Variables

See `.env.example` for all required environment variables. Key variables:

- `DATABASE_URL`: Database connection string (`file:./dev.db` for local SQLite)
- `AUTH_SECRET`: Secret for NextAuth.js
- `AUTH_GOOGLE_CLIENT_ID` / `AUTH_GOOGLE_CLIENT_SECRET`: Google OAuth credentials
- `R2_PUBLIC_URL`: (Optional) Custom domain for R2 public URLs

## Development

```bash
# Install dependencies
yarn install

# Run development server (uses local SQLite)
DATABASE_URL="file:./dev.db" yarn dev

# Run linter
yarn lint

# Run type checking
yarn typecheck

# Format code
yarn format:write
```

## Database Management

```bash
# Generate Drizzle migrations
yarn db:generate

# Push schema to database (local development)
DATABASE_URL="file:./dev.db" yarn db:push

# Apply migrations (production)
yarn cf:d1:migrate

# Open Drizzle Studio
yarn db:studio
```