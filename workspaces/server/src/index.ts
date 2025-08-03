import { drizzle } from 'drizzle-orm/d1';
import { Hono } from 'hono';

import { users } from './db/schema';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get('/api/hello', (c) => {
  return c.json({ msg: 'Hello from worker!' });
});

export default app
