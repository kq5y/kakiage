import { Hono } from 'hono';

import { success } from '@/libs/response';
import { authMiddleware } from '@/middlewares/auth';

const router = new Hono<Env>();

router.get('/me', authMiddleware(), (c) => {
  const user = c.get('user');
  return c.json(success(user), 200);
});

export { router };
