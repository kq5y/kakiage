import { Hono } from "hono";

import { getUploadSignData } from "@/libs/cloudinary";
import { success } from "@/libs/response";

const router = new Hono<Env>().get("/sign", async c => {
  const signData = getUploadSignData(c.env);
  return c.json(success(signData), 200);
});

export { router };
