import { Hono } from 'hono';

import { error, success } from '@/libs/response';
import { router as authRouter } from '@/routes/auth';
import { router as categoriesRouter } from '@/routes/categories';
import { router as ctfsRouter } from '@/routes/ctfs';
import { router as tagsRouter } from '@/routes/tags';
import { router as usersRouter } from '@/routes/users';

const app = new Hono<Env>()
  .route('/api/v1/auth', authRouter)
  .route('/api/v1/users', usersRouter)
  .route('/api/v1/categories', categoriesRouter)
  .route('/api/v1/tags', tagsRouter)
  .route('/api/v1/ctfs', ctfsRouter)
  .notFound((c) => {
    return c.json(error('Not Found'), 404);
  });

export default app;
