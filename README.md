# kakiage

A web application for publishing CTF writeups

## Deploy

### Secrets (`server/.dev.vars` / `server/.prod.vars`)

- JWT_SECRET
  ```bash
  node -e "console.log(require('crypto').randomBytes(256).toString('base64'));"
  ```
- DISCORD_CLIENT_ID
- DISCORD_CLIENT_SECRET
- APP_DOMAIN
- IMAGE_API_DOMAIN
  [kq5y/go-image-api](https://github.com/kq5y/go-image-api)
- IMAGE_API_KEY
- TURSO_CONNECTION_URL
- TURSO_AUTH_TOKEN

### Build Variables (`client/.env`)

- PUBLIC_API_URL

### DB Setup

```bash
pnpm -F server db:migrate:prod
```

### Create First User

1. Execute the SQL statement with the unique token set in `initialize.sql`.
2. Go to `/login` and enter the invite code to register.
