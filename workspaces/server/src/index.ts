import { Hono } from "hono";

import { error } from "@/libs/response";
import { router as authRouter } from "@/routes/auth";
import { router as categoriesRouter } from "@/routes/categories";
import { router as ctfsRouter } from "@/routes/ctfs";
import { router as imagesRouter } from "@/routes/images";
import { router as tagsRouter } from "@/routes/tags";
import { router as usersRouter } from "@/routes/users";
import { router as writeupsRouter } from "@/routes/writeups";

const app = new Hono<Env>()
  .route("/api/v1/auth", authRouter)
  .route("/api/v1/users", usersRouter)
  .route("/api/v1/categories", categoriesRouter)
  .route("/api/v1/tags", tagsRouter)
  .route("/api/v1/ctfs", ctfsRouter)
  .route("/api/v1/images", imagesRouter)
  .route("/api/v1/writeups", writeupsRouter)
  .notFound(c => {
    return c.json(error("Not Found"), 404);
  })
  .onError((err, c) => {
    console.error("Unhandled error:", err);
    console.log(err.cause);
    return c.json(error("Internal Server Error"), 500);
  });

export default app;
