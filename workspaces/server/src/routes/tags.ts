import { Hono } from "hono";

import { getDB } from "@/db/client";
import { success } from "@/libs/response";

const router = new Hono<Env>().get("/", async (c) => {
  const db = getDB(c.env.DB);
  const list = await db.query.tags.findMany();
  return c.json(success(list), 200);
});

export { router };
