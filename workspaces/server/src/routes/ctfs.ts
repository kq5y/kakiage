import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';

import { getDB } from '@/db/client';
import { ctfs } from '@/db/schema';
import { error, success } from '@/libs/response';
import { authMiddleware } from '@/middlewares/auth';

const router = new Hono<Env>();

const idParamSchema = z.object({ id: z.string().regex(/^\d+$/, 'ID must be numeric') });
const ctfBodySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  url: z.url().optional(),
  startAt: z.number(),
  endAt: z.number(),
});

const validateIdParam = zValidator('param', idParamSchema, (res, c) =>
  !res.success ? c.json(error('Invalid ID format'), 400) : undefined
);
const validateCtfBody = zValidator('json', ctfBodySchema, (res, c) =>
  !res.success ? c.json(error('Invalid JSON format'), 400) : undefined
);

router.get('/', async (c) => {
  const db = getDB(c.env.DB);
  const list = await db.query.ctfs.findMany();
  return c.json(success(list));
});

router.post('/', authMiddleware(true), validateCtfBody, async (c) => {
  const db = getDB(c.env.DB);
  const { name, url, startAt, endAt } = c.req.valid('json');
  const [ctf] = await db.insert(ctfs).values({
    name,
    url,
    startAt: new Date(startAt),
    endAt: new Date(endAt),
  }).returning();
  return c.json(success(ctf), 201);
});

router.get('/:id', validateIdParam, async (c) => {
  const db = getDB(c.env.DB);
  const id = Number(c.req.valid('param').id);
  const ctf = await db.query.ctfs.findFirst({
    where: eq(ctfs.id, id),
    with: {
      writeups: {
        columns: {
          content: false
        }
      },
    },
  });
  if (!ctf) {
    return c.json(error('CTF not found'), 404);
  }
  return c.json(success(ctf));
});

router.patch('/:id', authMiddleware(true), validateIdParam, validateCtfBody, async (c) => {
  const db = getDB(c.env.DB);
  const id = Number(c.req.valid('param').id);
  const { name, url, startAt, endAt } = c.req.valid('json');
  const [ctf] = await db.update(ctfs).set({
    name,
    url,
    startAt: new Date(startAt),
    endAt: new Date(endAt),
  }).where(eq(ctfs.id, id)).returning();
  if (!ctf) {
    return c.json(error('CTF not found'), 404);
  }
  return c.json(success(ctf));
});

router.delete('/:id', authMiddleware(true, true), validateIdParam, async (c) => {
  const db = getDB(c.env.DB);
  const id = Number(c.req.valid('param').id);
  const deleted = await db.delete(ctfs).where(eq(ctfs.id, id)).returning();
  if (deleted.length === 0) {
    return c.json(error('CTF not found'), 404);
  }
  return c.json(success());
});

export { router };
