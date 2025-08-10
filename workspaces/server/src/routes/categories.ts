import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { createFactory } from 'hono/factory';
import { z } from 'zod';

import { getDB } from '@/db/client';
import { categories } from '@/db/schema';
import { error, success } from '@/libs/response';
import { withAuth } from '@/wrappers/auth';
import { withValidates } from '@/wrappers/validate';

const factory = createFactory<Env>();

const idParamSchema = z.object({ id: z.string().regex(/^\d+$/, 'ID must be numeric') });
const categoryBodySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  color: z.string().regex(/^#([0-9A-F]{3}|[0-9A-F]{6})$/, 'Color must be a valid hex code'),
});

const getHandlers = factory.createHandlers(async (c) => {
  const db = getDB(c.env.DB);
  const list = await db.query.categories.findMany();
  return c.json(success(list), 200);
});

const postHandlers = factory.createHandlers(withAuth(withValidates({json: categoryBodySchema}, async (c) => {
  const db = getDB(c.env.DB);
  const { name, color } = c.req.valid('json');
  const [ category ] = await db.insert(categories).values({ name, color }).returning();
  return c.json(success(category), 201);
}), true, ['admin']));

const patchHandlers = factory.createHandlers(withAuth(withValidates({param: idParamSchema, json: categoryBodySchema}, async (c) => {
  const db = getDB(c.env.DB);
  const id = Number(c.req.valid('param').id);
  const { name, color } = c.req.valid('json');
  const [ category ] = await db.update(categories).set({ name, color }).where(eq(categories.id, id)).returning();
  if (!category) {
    return c.json(error('Category not found'), 404);
  }
  return c.json(success(category), 200);
}), true, ['admin']));

const deleteHandlers = factory.createHandlers(withAuth(withValidates({param: idParamSchema}, async (c) => {
  const db = getDB(c.env.DB);
  const id = Number(c.req.valid('param').id);
  const deleted = await db.delete(categories).where(eq(categories.id, id)).returning();
  if (deleted.length === 0) {
    return c.json(error('Category not found'), 404);
  }
  return c.json(success(), 200);
}), true, ['admin']));

const router = new Hono<Env>()
  .get('/', ...getHandlers)
  .post('/', ...postHandlers)
  .patch('/:id', ...patchHandlers)
  .delete('/:id', ...deleteHandlers);

export { router };
