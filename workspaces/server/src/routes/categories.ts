import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';

import { getDB } from '@/db/client';
import { categories } from '@/db/schema';
import { authMiddleware } from '@/middlewares/auth';

const router = new Hono<Env>();

const idParamSchema = z.object({ id: z.string().regex(/^\d+$/, 'ID must be numeric') });
const categoryBodySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  color: z.string().regex(/^#([0-9A-F]{3}|[0-9A-F]{6})$/, 'Color must be a valid hex code'),
});

const validateIdParam = zValidator('param', idParamSchema, (res, c) =>
  !res.success ? c.json({ error: 'Invalid ID format' }, 400) : undefined
);
const validateCategoryBody = zValidator('json', categoryBodySchema, (res, c) =>
  !res.success ? c.json({ error: 'Invalid JSON format' }, 400) : undefined
);

router.get('/', async (c) => {
  const db = getDB(c.env.DB);
  const list = await db.query.categories.findMany();
  return c.json(list);
});

router.post('/', authMiddleware(true, true), validateCategoryBody, async (c) => {
  const db = getDB(c.env.DB);
  const { name, color } = c.req.valid('json');
  const [ category ] = await db.insert(categories).values({ name, color }).returning();
  return c.json(category, 201);
});

router.patch('/:id', authMiddleware(true, true), validateIdParam, validateCategoryBody, async (c) => {
  const db = getDB(c.env.DB);
  const id = Number(c.req.valid('param').id);
  const { name, color } = c.req.valid('json');
  const [ category ] = await db.update(categories).set({ name, color }).where(eq(categories.id, id)).returning();
  if (!category) {
    return c.json({ error: 'Category not found' }, 404);
  }
  return c.json(category);
});

router.delete('/:id', authMiddleware(true, true), validateIdParam, async (c) => {
  const db = getDB(c.env.DB);
  const id = Number(c.req.valid('param').id);
  const deleted = await db.delete(categories).where(eq(categories.id, id)).returning();
  if (deleted.length === 0) {
    return c.json({ error: 'Category not found' }, 404);
  }
  return c.json({ success: true });
});

export { router };
