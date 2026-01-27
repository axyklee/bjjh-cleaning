# Cloudflare Deployment Guide

## Overview

This guide provides detailed instructions for deploying the BJJH Cleaning application to Cloudflare Pages with D1 database and R2 storage using OpenNext.js and Drizzle ORM.

## Prerequisites

1. **Cloudflare Account**: Sign up at [dash.cloudflare.com](https://dash.cloudflare.com/sign-up)
2. **Wrangler CLI**: Install globally
   ```bash
   npm install -g wrangler
   # or
   yarn global add wrangler
   ```
3. **Node.js**: Version 18 or higher
4. **Git**: For repository management

## Initial Setup

### 1. Install Dependencies

```bash
yarn install
```

### 2. Authenticate with Cloudflare

```bash
wrangler login
```

This will open a browser window for authentication.

### 3. Create D1 Database

```bash
yarn cf:d1:create
# or manually:
# wrangler d1 create bjjh-cleaning-db
```

**Important**: Copy the `database_id` from the output and update `wrangler.jsonc`:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "bjjh-cleaning-db",
    "database_id": "YOUR_DATABASE_ID_HERE"  // Replace with actual ID
  }
]
```

### 4. Create R2 Bucket

```bash
yarn cf:r2:create
# or manually:
# wrangler r2 bucket create bjjh-cleaning-storage
```

### 5. Set Up Database Schema

Using Drizzle ORM with D1:

```bash
# Generate Drizzle migrations
yarn db:generate

# Test schema locally
DATABASE_URL="file:./dev.db" yarn db:push

# Apply migrations to D1 database
yarn cf:d1:migrate
```

### 6. Configure Environment Variables

Set up secrets in Cloudflare:

```bash
# Required secrets
wrangler secret put AUTH_SECRET
# Generate with: openssl rand -base64 32

wrangler secret put AUTH_GOOGLE_CLIENT_ID
# Get from Google Cloud Console

wrangler secret put AUTH_GOOGLE_CLIENT_SECRET
# Get from Google Cloud Console

# Set AUTH_URL via wrangler.toml or secret
wrangler secret put AUTH_URL
# Use your Cloudflare Pages URL, e.g., https://bjjh-cleaning.pages.dev
```

Update `wrangler.toml` with non-secret variables if needed:

```toml
[vars]
NODE_ENV = "production"
AUTH_TRUST_HOST = "true"
```

## Building and Deploying

### Option 1: Manual Deployment via Wrangler

```bash
# Build Next.js application
SKIP_ENV_VALIDATION=1 yarn build

# Build for Cloudflare Pages
yarn pages:build

# Deploy to Cloudflare Pages
yarn pages:deploy
```

### Option 2: Automatic Deployment via GitHub

1. Go to [Cloudflare Pages Dashboard](https://dash.cloudflare.com/pages)
2. Click "Create a project"
3. Connect your GitHub repository
4. Configure build settings:
   - **Build command**: `yarn build && yarn pages:build`
   - **Build output directory**: `.open-next/worker`
   - **Environment variables**: Add all required variables from `.env.example`

Cloudflare will automatically deploy on every push to your main branch.

## Local Development with Wrangler

To test locally with Cloudflare Workers environment:

```bash
# Build the application
SKIP_ENV_VALIDATION=1 yarn build
yarn pages:build

# Create a .dev.vars file for local secrets (don't commit this)
cat > .dev.vars << EOF
AUTH_SECRET="your-dev-secret"
AUTH_GOOGLE_CLIENT_ID="your-client-id"
AUTH_GOOGLE_CLIENT_SECRET="your-client-secret"
AUTH_URL="http://localhost:8788"
DATABASE_URL="file:./dev.db"
EOF

# Run with wrangler
yarn pages:dev
```

Visit http://localhost:8788 to test the application.

## Database Migrations

When you update the Drizzle schema:

1. Generate new migration:
   ```bash
   yarn db:generate
   ```

2. Review the generated migration in `drizzle/` directory

3. Apply to local database (testing):
   ```bash
   DATABASE_URL="file:./dev.db" yarn db:push
   ```

4. Apply to D1 (production):
   ```bash
   yarn cf:d1:migrate
   ```

## R2 Storage Configuration

### Important: File Upload with R2

The current implementation uses presigned URLs for file uploads. R2 doesn't support presigned PUT URLs in the same way as S3/MinIO. You'll need to implement one of these solutions:

**Option 1: Direct Upload via Worker (Recommended)**
Create a custom API endpoint in your Worker that accepts file data and uses `R2.put()` directly:

```typescript
// Example: /api/upload endpoint
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file');
  const key = formData.get('key');
  
  await env.R2.put(key, file);
  return new Response(JSON.stringify({ success: true }));
}
```

**Option 2: Public Bucket with Direct Upload**
Configure the R2 bucket to allow public uploads (less secure, only for development):
1. Enable public access in R2 bucket settings
2. Use CORS configuration to allow uploads from your domain

**Option 3: Cloudflare Upload API**
Use Cloudflare's upload API with signed upload URLs generated from your Worker.

### Public Access

If you want images to be publicly accessible:

1. Configure R2 bucket for public access in Cloudflare dashboard
2. Set `R2_PUBLIC_URL` in wrangler.toml or as a secret:
   ```bash
   wrangler secret put R2_PUBLIC_URL
   # Value: https://pub-xyz.r2.dev or your custom domain
   ```

### Custom Domain

To use a custom domain for R2:

1. Go to R2 bucket settings in Cloudflare dashboard
2. Click "Connect Custom Domain"
3. Follow the instructions to set up DNS
4. Update `R2_PUBLIC_URL` with your custom domain

## Troubleshooting

### Build Fails

- Ensure all environment variables are set
- Try running with `SKIP_ENV_VALIDATION=1` for local builds
- Check Node.js version (must be 18+)

### D1 Database Connection Issues

- Verify `database_id` in `wrangler.jsonc` matches your D1 database
- Check that migrations have been applied
- Ensure binding name `DB` matches in wrangler.jsonc

### R2 Storage Issues

- Verify R2 bucket exists: `wrangler r2 bucket list`
- Check bucket binding in wrangler.jsonc
- Ensure `R2_PUBLIC_URL` is set correctly

### NextAuth Issues

- Verify `AUTH_SECRET` is set and secure
- Check Google OAuth credentials are correct
- Ensure `AUTH_URL` matches your deployment URL
- Update Google OAuth allowed redirect URLs

## Production Checklist

Before deploying to production:

- [ ] All secrets are set in Cloudflare
- [ ] D1 database is created and migrations applied
- [ ] R2 bucket is created and configured
- [ ] Google OAuth credentials configured with correct redirect URLs
- [ ] `AUTH_URL` points to production domain
- [ ] Custom domain configured (if using)
- [ ] Database backed up (export from D1)
- [ ] Test authentication flow
- [ ] Test file upload/download
- [ ] Monitor error logs in Cloudflare dashboard

## Monitoring and Logs

View logs and metrics:

```bash
# View recent logs
wrangler pages deployment tail

# View specific deployment
wrangler pages deployment list
```

Or use the Cloudflare dashboard for detailed analytics and error tracking.

## Costs

Cloudflare Workers and Pages have generous free tiers:

- **Pages**: Unlimited requests, 500 builds/month
- **D1**: 5GB storage, 5M reads/day, 100K writes/day (free tier)
- **R2**: 10GB storage, 1M reads/month, 1M writes/month (free tier)

Check [Cloudflare pricing](https://www.cloudflare.com/pricing/) for current limits.

## Support

For issues specific to Cloudflare deployment:
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Cloudflare Community](https://community.cloudflare.com/)
