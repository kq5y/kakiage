import { Hono } from "hono";

export const apiRouter = new Hono<Env>()
  .basePath('/v1')
