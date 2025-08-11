import type { Context } from 'hono';
import { deleteCookie, getCookie } from 'hono/cookie';
import { verify } from 'hono/jwt';

import { getDB } from '@/db/client';
import type { User } from '@/db/schema';

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

export class AuthError extends Error {
  constructor(public message: string, public statusCode: 401 | 403) {
    super(message);
    this.name = 'AuthError';
  }
}

export async function checkAuth<
  E extends Env,
  L extends boolean = true,
  A extends boolean = false,
>(
  c: Context<E>,
  requireAuth: L = true as L,
  requireAdmin: A = false as A
): Promise<Context<E & HasUser<L, A>>> {
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
    throw new AuthError('Unauthorized', 401);
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
      throw new AuthError('Unauthorized', 401);
    }
    if (requireAdmin && user.role !== 'admin') {
      throw new AuthError('Forbidden', 403);
    }
  }

  return c as unknown as Context<E & HasUser<L, A>>;
}
