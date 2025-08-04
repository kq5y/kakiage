import { Hono } from 'hono';

import { apiRouter } from './routes/api';

const app = new Hono<Env>();

app.route('/api', apiRouter);

export default app;
