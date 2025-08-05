import { Hono } from 'hono';

import { router as authRouter } from '@/routes/auth';
import { router as categoriesRouter } from '@/routes/categories';
import { router as usersRouter } from '@/routes/users';

const app = new Hono<Env>();

app.route('/api/v1/auth', authRouter);
app.route('/api/v1/users', usersRouter);
app.route('/api/v1/categories', categoriesRouter);

app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

export default app;
