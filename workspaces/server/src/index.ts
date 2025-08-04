import { Hono } from 'hono';

import { apiRouter } from './routes/api';

const app = new Hono<Env>();

app.route('/api', apiRouter);

app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

export default app;
