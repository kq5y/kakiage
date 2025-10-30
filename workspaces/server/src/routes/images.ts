import { Hono } from "hono";
import { env } from "hono/adapter";

import { getUploadSignData } from "../libs/cloudinary.js";
import { error, success } from "../libs/response.js";
import { withAuth } from "../middlewares/auth.js";
import type { Env } from "../types.js";

const router = new Hono<Env>().get("/sign", withAuth(true), async c => {
  try {
    const signData = await getUploadSignData(env(c));
    return c.json(success(signData), 200);
  } catch (_e) {
    return c.json(error("Internal Server Error"), 500);
  }
});

export { router };
