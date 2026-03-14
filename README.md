# BJJH Cleaning
## 濱江實中 掃區評比系統

## Development

1. At `dev/`, Start Postgres and Minio development containers.
```bash
cd dev
sudo docker compose up
```

2. In another terminal, copy `.env.example` to `.env`, then add your Google OAuth Credentials.
```bash
cp .env.example .env
nano .env
```

3. Select the project's node version and install packages.
```bash
nvm use
yarn
```

4. Push migrations to the dev database.
```bash
yarn db:push
```

5. Start the NextJS development server.
```bash
yarn dev
```

6. Navigate to [http://localhost:3000](http://localhost:3000) and login. The first user that attempts login will be assigned as the administrator. Subsequent users will need to be granted access in settings.

## Deployment

### Google Cloud Run

This project is compatible with Google Cloud Run. You will need to supply your own Postgres database and S3-compatible storage solution.

### Docker

You can also deploy to your own server using the `docker-compose.yml` file supplied at the root of the project.

```bash
docker compose up -d
```

The web server will be exposed at `:9220`. The minio endpoint is `:9222`