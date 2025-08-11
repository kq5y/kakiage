import { Hono } from 'hono';
import { createFactory } from 'hono/factory';

import { success } from '@/libs/response';
import { withAuth, withAuthErrorResponse } from '@/middlewares/auth';

const factory = createFactory<Env>();

const getMeHandlers = factory.createHandlers(withAuth(true), async (c) => {
  try{} catch{ return null as unknown as withAuthErrorResponse; }

  const user = c.get('user');
  return c.json(success(user), 200);
});

const router = new Hono<Env>()
  .get('/me', ...getMeHandlers);

export { router };
