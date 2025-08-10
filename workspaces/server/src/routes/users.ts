import { Hono } from 'hono';
import { createFactory } from 'hono/factory';

import { success } from '@/libs/response';
import { withAuth } from '@/wrappers/auth';

const factory = createFactory<Env>();

const getMeHandlers = factory.createHandlers(withAuth(async (c) => {
  const user = c.get('user');
  return c.json(success(user), 200);
}));

const router = new Hono<Env>()
  .get('/me', ...getMeHandlers);

export { router };
