import type { Input } from 'hono';
import { deleteCookie, getCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';
import { verify } from 'hono/jwt';

import { getDB } from '@/db/client';
import type { User } from '@/db/schema';
import { error, JsonErrorResponse } from '@/libs/response';

export type HasUser<
  L extends boolean = true,
  A extends boolean = false
> = {
  Variables: {
    user: L extends true
      ? (A extends true ? (User & { role: 'admin' }) : User)
      : (A extends true ? (User & { role: 'admin' } | null) : User | null);
  };
};

export type withAuthErrorResponse<A extends boolean = false> = JsonErrorResponse<
  A extends true ? 401 | 403 : 401
>;

export function withAuth<
  E extends Env,
  P extends string,
  I extends Input,
  L extends boolean = true,
  A extends boolean = false,
>(
  requireAuth: L = true as L,
  requireAdmin: A = false as A
) {
  return createMiddleware<E & HasUser<L, A>, P, I>(async (c, next) => {
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
      if (requireAdmin && user.role !== 'admin') {
        return c.json(error('Forbidden'), 403);
      }
    }

    c.set('user', user as any);
    await next();
  });
}
