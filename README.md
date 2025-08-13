# kakiage

A web application for publishing CTF writeups

## Deploy

### Secrets

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

### Build Variables

- PUBLIC_API_URL

### DB Setup

```bash
pnpm --filter server db:apply --remote
```
