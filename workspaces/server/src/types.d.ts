type Bindings = {
  KV: KVNamespace;
  JWT_SECRET: string;
  DISCORD_CLIENT_ID: string;
  DISCORD_CLIENT_SECRET: string;
  APP_DOMAIN: string;
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
  TURSO_CONNECTION_URL: string;
  TURSO_AUTH_TOKEN: string;
};

type Env = { Bindings: Bindings };
