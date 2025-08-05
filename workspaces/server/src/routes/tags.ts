import { Hono } from 'hono';

import { getDB } from '@/db/client';

const router = new Hono<Env>();

router.get('/', async (c) => {
  const db = getDB(c.env.DB);
  const list = await db.query.tags.findMany();
  return c.json(list);
});

export { router };
