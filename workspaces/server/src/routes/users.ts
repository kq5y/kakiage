import { Hono } from "hono";

import { success } from "../libs/response.js";
import { withAuth } from "../middlewares/auth.js";
import type { Env } from "../types.js";

const router = new Hono<Env>().get("/me", withAuth(true), async c => {
  const user = c.get("user");
  return c.json(success(user), 200);
});

export { router };
