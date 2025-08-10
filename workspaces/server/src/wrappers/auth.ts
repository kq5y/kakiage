import type { Context, Input, Next } from 'hono';
import { deleteCookie, getCookie } from 'hono/cookie';
import { verify } from 'hono/jwt';
import type { HandlerResponse } from 'hono/types';

import { getDB } from '@/db/client';
import type { Role, User } from '@/db/schema';
import { error, JsonErrorResponse } from '@/libs/response';

export type HasUser<A extends boolean = true> = {
  Variables: {
    user: A extends true ? User : User | null;
  };
};

type AsyncHandler<E extends Env, P extends string, I extends Input, R> =
  (c: Context<E, P, I>, next: Next) => R | Promise<R>;

export function withAuth<
  BaseE extends Env,
  HandlerE extends BaseE & HasUser<A>,
  I extends Input,
  P extends string = any,
  R extends HandlerResponse<any> = any,
  A extends boolean = true
>(
  handler: AsyncHandler<HandlerE, P, I, R>,
  requireAuth: A = true as A,
  requireRoles: Role[] = ["admin", "user"]
): AsyncHandler<BaseE, P, I, R | JsonErrorResponse<401 | 403>> {
  return async (c, next) => {
    const token = getCookie(c, 'session');

    let userId: string | null = null;
    if (token) {
      try {
        const decoded = await verify(token, c.env.JWT_SECRET, 'HS256');
        userId = (decoded.data as any)?.id ?? null;
      } catch (err) {
        console.error('JWT verification failed:', err);
        deleteCookie(c, 'session');
      }
    }

    if (requireAuth && !userId) {
      return c.json(error('Unauthorized'), 401);
    }
    
    let user: User | null = null;
    if (userId) {
      const db = getDB(c.env.DB);
      user = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, userId)
      }) || null;
    }

    if (requireAuth) {
      if (!user) {
        deleteCookie(c, 'session');
        return c.json(error('Unauthorized'), 401);
      }
      if (!requireRoles.includes(user.role)) {
        return c.json(error('Forbidden'), 403);
      }
    }

    (c as unknown as Context<HandlerE, P, I>).set('user', user);

    return handler(c as unknown as Context<HandlerE, P, I>, next);
  };
}
