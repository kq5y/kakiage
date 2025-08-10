import { Hono } from 'hono';
import { createFactory } from 'hono/factory';

import { getDB } from '@/db/client';
import { success } from '@/libs/response';

const factory = createFactory<Env>();

const getHandlers = factory.createHandlers(async (c) => {
  const db = getDB(c.env.DB);
  const list = await db.query.tags.findMany();
  return c.json(success(list), 200);
});

const router = new Hono<Env>()
  .get('/', ...getHandlers);

export { router };
