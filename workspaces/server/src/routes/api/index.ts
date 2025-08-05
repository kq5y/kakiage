import { Hono } from 'hono';

import { router as authRouter } from "./auth";
import { router as UsersRouter } from "./users";

const apiRouter = new Hono<Env>().basePath('/v1');

apiRouter.route('/auth', authRouter);
apiRouter.route('/users', UsersRouter);

export { apiRouter };
