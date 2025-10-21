# kakiage

A web application for publishing CTF writeups

## Deploy

### Secrets (`server/.dev.vars`)

- JWT_SECRET
  ```bash
  node -e "console.log(require('crypto').randomBytes(256).toString('base64'));"
  ```
- DISCORD_CLIENT_ID
- DISCORD_CLIENT_SECRET
- APP_DOMAIN
- IMAGE_API_DOMAIN
  [kakiage/go-image-api](https://github.com/kq5y/go-image-api)
- IMAGE_API_KEY

### Build Variables (`client/.env`)

- PUBLIC_API_URL

### DB Setup

```bash
pnpm --filter server db:apply --remote
```

### Create First User

1. Create a unique token and edit `initialize.sql`.
2. Add a user registration token to the DB.
    ```bash
    wrangler d1 execute kakiage-db --file initialize.sql
    ```
3. Send a POST request to the login endpoint with the inviteToken attached to the form.
