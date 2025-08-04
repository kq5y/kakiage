import { Hono } from "hono";

import { router } from "./auth";

const apiRouter = new Hono<Env>().basePath('/v1');

apiRouter.route('/auth', router);

export { apiRouter };
