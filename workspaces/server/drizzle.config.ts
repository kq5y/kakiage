import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

const currentEnv = process.env.ENV ?? "development";
dotenv.config({
  path: currentEnv === "production" ? ".prod.vars" : ".dev.vars",
});

const { TURSO_CONNECTION_URL, TURSO_AUTH_TOKEN } = process.env;

if (!TURSO_CONNECTION_URL || !TURSO_AUTH_TOKEN) {
  throw new Error("TURSO_CONNECTION_URL and TURSO_AUTH_TOKEN must be set in environment variables");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./migrations",
  dialect: 'turso',
  dbCredentials: {
    url: TURSO_CONNECTION_URL,
    authToken: TURSO_AUTH_TOKEN,
  }
});
