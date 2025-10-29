import { Hono } from "hono";

import { getUploadSignData } from "@/libs/cloudinary";
import { error, success } from "@/libs/response";

const router = new Hono<Env>().get("/sign", async c => {
  try {
    const signData = await getUploadSignData(c.env);
    return c.json(success(signData), 200);
  } catch (_e) {
    return c.json(error("Internal Server Error"), 500);
  }
});

export { router };
