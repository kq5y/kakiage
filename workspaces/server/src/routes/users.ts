import { Hono } from 'hono';
import { createFactory } from 'hono/factory';

import { AuthError, checkAuth } from '@/checkers/auth';
import { error, success } from '@/libs/response';

const factory = createFactory<Env>();

const getMeHandlers = factory.createHandlers(async (_c) => {
  let c; try {
    c = await checkAuth(_c, true);
  } catch (err) {
    if (err instanceof AuthError) {
      return _c.json(error(err.message), err.statusCode);
    }
    throw err;
  }
  
  const user = c.get('user');
  return c.json(success(user), 200);
});

const router = new Hono<Env>()
  .get('/me', ...getMeHandlers);

export { router };
