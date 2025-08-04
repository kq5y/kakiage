type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
  DISCORD_CLIENT_ID: string;
  DISCORD_CLIENT_SECRET: string;
  APP_DOMAIN: string;
};

type Env = { Bindings: Bindings };
