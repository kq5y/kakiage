import { deleteCookie, getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";

import { getDB } from "@/db/client";
import type { User } from "@/db/schema";

export function authMiddleware<R extends boolean = true>(
  requireAuth: R = true as R,
  adminOnly: boolean = false,
  userIds: string[] = []
) {
  return createMiddleware<Env & {
    Variables: {
      user: R extends true ? User : User | null;
    }
  }>(async (c, next) => {
    const token = getCookie(c, 'session');

    let userId: string | null = null;
    if (token) {
      try {
        const decoded = await verify(token, c.env.JWT_SECRET, 'HS256');
        const data = decoded.data as { id: string };
        userId = data.id || null;
      } catch (err) {
        console.error('JWT verification failed:', err);
        deleteCookie(c, 'session');
      }
    }

    if (requireAuth && !userId) {
      return c.json({ error: 'Unauthorized' }, 401);
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
        return c.json({ error: 'Unauthorized' }, 401);
      }
      if (adminOnly && user.role !== 'admin') {
        return c.json({ error: 'Forbidden' }, 403);
      }
      if (userIds.length > 0 && !(userIds.includes(user.id) || user.role === 'admin')) {
        return c.json({ error: 'Forbidden' }, 403);
      }
    }

    c.set('user', user as any);
    await next();
  });
};
