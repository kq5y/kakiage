type Bindings = {
  DB: D1Database;
  R2_IMG: R2Bucket;
  JWT_SECRET: string;
  DISCORD_CLIENT_ID: string;
  DISCORD_CLIENT_SECRET: string;
  APP_DOMAIN: string;
  IMAGE_API_DOMAIN: string;
  IMAGE_API_KEY: string;
};

type Env = { Bindings: Bindings };
