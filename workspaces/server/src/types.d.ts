type Bindings = {
  R2_IMG: R2Bucket;
  JWT_SECRET: string;
  DISCORD_CLIENT_ID: string;
  DISCORD_CLIENT_SECRET: string;
  APP_DOMAIN: string;
  IMAGE_API_DOMAIN: string;
  IMAGE_API_KEY: string;
  TURSO_CONNECTION_URL: string;
  TURSO_AUTH_TOKEN: string;
};

type Env = { Bindings: Bindings };
