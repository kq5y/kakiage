import { Hono } from "hono";
import { env } from "hono/adapter";

import { getDB } from "../db/client.js";
import { success } from "../libs/response.js";
import type { Env } from "../types.js";

const router = new Hono<Env>().get("/", async c => {
  const db = getDB(env(c));
  const list = await db.query.tags.findMany();
  return c.json(success(list), 200);
});

export { router };
