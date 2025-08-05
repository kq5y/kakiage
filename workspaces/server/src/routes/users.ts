import { Hono } from 'hono';

import { authMiddleware } from '@/middlewares/auth';

const router = new Hono<Env>();

router.get('/me', authMiddleware(), (c) => {
  const user = c.get('user');
  return c.json(user, 200);
});

export { router };
