import { Hono } from "hono";

import { success } from "@/libs/response";
import { withAuth } from "@/middlewares/auth";

const router = new Hono<Env>().get("/me", withAuth(true), async (c) => {
  const user = c.get("user");
  return c.json(success(user), 200);
});

export { router };
