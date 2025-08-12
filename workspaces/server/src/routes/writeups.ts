import { and, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { createFactory } from 'hono/factory';
import DOMPurify from 'isomorphic-dompurify';
import { marked } from 'marked';
import { z } from 'zod';

import { getDB } from '@/db/client';
import { tags, writeupToTags, writeups } from '@/db/schema';
import { error, success } from '@/libs/response';
import { withAuth, withAuthErrorResponse } from '@/middlewares/auth';
import { withValidates, withValidatesErrorResponse } from '@/middlewares/validate';

const factory = createFactory<Env>();

const idParamSchema = z.object({ id: z.string().regex(/^\d+$/, 'ID must be numeric') });
const writeupSearchQuerySchema = z.object({
  q: z.string().min(1).max(100).optional(),
  categoryId: z.number().min(1).optional(),
  tag: z.string().min(1).max(100).optional(),
  pageSize: z.number().min(1).max(100).optional(),
  page: z.number().min(1).optional(),
  sortKey: z.enum(['createdAt', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
const writeupCreateBodySchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-zA-Z0-9_-]+$/),
  ctfId: z.number().min(1),
  categoryId: z.number().min(1),
  points: z.number().min(0).optional(),
  solvers: z.number().min(0).optional(),
  password: z.string().min(1).optional(),
});
const writeupUpdateBodySchema = z.object({
  title: z.string().min(1),
  categoryId: z.number().min(1),
  points: z.number().min(0).optional(),
  solvers: z.number().min(0).optional(),
  password: z.string().min(1).optional(),
});
const writeupContentSchema = z.object({
  content: z.string().max(200_000)
});
const writeupTagPostSchema = z.object({
  name: z.string().min(1).max(100)
});
const writeupTagDeleteSchema = z.object({
  id: z.number().min(1)
});
const writeupPasswordHeaderSchema = z.object({
  'x-password': z.string().min(1).optional()
});

function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target'],
    ALLOWED_TAGS: [
      'a', 'abbr', 'b', 'blockquote', 'br', 'code', 'dd', 'del', 'div', 
      'dl', 'dt', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i', 
      'img', 'kbd', 'li', 'ol', 'p', 'pre', 's', 'span', 'strong', 
      'sub', 'sup', 'table', 'tbody', 'td', 'th', 'thead', 'tr', 'ul'
    ],
    ALLOWED_ATTR: [
      'alt', 'class', 'href', 'id', 'src', 'target', 'title'
    ]
  });
}

async function getHash(text: string): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const markdownToHtml = async (markdown: string) => {
  const dirty = await marked.parse(markdown, { gfm: true, breaks: true });
  return sanitizeHtml(dirty);
}

const getWriteupsHandlers = factory.createHandlers(withValidates({ query: writeupSearchQuerySchema }), async (c) => {
  try{} catch{ return null as unknown as withValidatesErrorResponse; }
  
  const db = getDB(c.env.DB);
  const { q, categoryId, tag, pageSize, page, sortKey, sortOrder } = c.req.valid('query');

  let writeupIds: number[] | undefined;
  if (tag) {
    const tagRecord = await db.query.tags.findFirst({
      where: (tags, { eq }) => eq(tags.name, tag)
    });
    if (!tagRecord) {
      return c.json(error('Tag not found'), 404);
    }
    const writeupsByTagRecords = await db.query.writeupToTags.findMany({
      where: (writeupToTags, { eq }) => eq(writeupToTags.tagId, tagRecord.id)
    });
    writeupIds = writeupsByTagRecords.map(record => record.writeupId);
    if (writeupIds.length === 0) {
      return c.json(error('No writeups found for this tag'), 404);
    }
  }

  const writeupsList = await db.query.writeups.findMany({
    limit: pageSize || 10,
    offset: ((page || 1) - 1) * (pageSize || 10),
    orderBy: (writeups, { asc, desc }) => [sortOrder === 'asc' ? asc(writeups[sortKey || 'createdAt']) : desc(writeups[sortKey || 'createdAt'])],
    where: (writeups, { and, eq, like, inArray }) => and(
      q ? like(writeups.title, `%${q}%`) : undefined,
      categoryId ? eq(writeups.categoryId, categoryId) : undefined,
      writeupIds ? inArray(writeups.id, writeupIds) : undefined
    ),
    columns: {
      content: false,
      categoryId: false,
      createdBy: false,
      password: false,
    },
    with: {
      category: true,
      createdByUser: true,
      writeupToTags: {
        with: {
          tag: true,
        }
      }
    },
  });

  const formattedWriteups = writeupsList.map(w => ({
    ...w,
    tags: w.writeupToTags.map(wt => wt.tag),
    writeupToTags: undefined
  }));
  return c.json(success(formattedWriteups), 200);
});

const postWriteupHandlers = factory.createHandlers(withAuth(true), withValidates({ json: writeupCreateBodySchema }), async (c) => {
  try{} catch{ return null as unknown as withAuthErrorResponse | withValidatesErrorResponse; }

  const db = getDB(c.env.DB);
  const { title, slug, ctfId, categoryId, points, solvers, password } = c.req.valid('json');
  const user = c.get('user');

  const [ writeup ] = await db.insert(writeups).values({
    title,
    slug,
    ctfId,
    content: '',
    categoryId: categoryId,
    points: points,
    solvers: solvers,
    password: password ? await getHash(password) : undefined,
    createdBy: user.id,
  }).returning();

  return c.json(success({
    ...writeup,
    password: undefined,
  }), 201);
});

const getWriteupHandlers = factory.createHandlers(withValidates({ param: idParamSchema }), async (c) => {
  try{} catch{ return null as unknown as withValidatesErrorResponse; }

  const db = getDB(c.env.DB);
  const id = Number(c.req.valid('param').id);

  const writeup = await db.query.writeups.findFirst({
    where: (writeups, { eq }) => eq(writeups.id, id),
    columns: {
      content: false,
      categoryId: false,
      createdBy: false,
      password: false,
    },
    with: {
      category: true,
      createdByUser: true,
      writeupToTags: {
        with: {
          tag: true,
        }
      }
    },
  });

  if (!writeup) {
    return c.json(error('Writeup not found'), 404);
  }

  const formattedWriteup = {
    ...writeup,
    tags: writeup.writeupToTags.map(wt => wt.tag),
    writeupToTags: undefined
  };

  return c.json(success(formattedWriteup), 200);
});

const getWriteupTagsHandlers = factory.createHandlers(withValidates({ param: idParamSchema }), async (c) => {
  try{} catch{ return null as unknown as withValidatesErrorResponse; }

  const db = getDB(c.env.DB);
  const id = Number(c.req.valid('param').id);

  const writeup = await db.query.writeups.findFirst({
    where: (writeups, { eq }) => eq(writeups.id, id),
    with: {
      writeupToTags: {
        with: {
          tag: true,
        }
      }
    },
    columns: {
      content: false,
      categoryId: false,
      createdBy: false,
    },
  });

  if (!writeup) {
    return c.json(error('Writeup not found'), 404);
  }

  const writeupTags = writeup.writeupToTags.map(wt => wt.tag);
  return c.json(success(writeupTags), 200);
});

const postWriteupTagsHandlers = factory.createHandlers(withAuth(true), withValidates({ param: idParamSchema, json: writeupTagPostSchema }), async (c) => {
  try {} catch { return null as unknown as withAuthErrorResponse | withValidatesErrorResponse; }

  const db = getDB(c.env.DB);
  const id = Number(c.req.valid('param').id);
  const { name } = c.req.valid('json');
  const user = c.get('user');

  const existingWriteup = await db.query.writeups.findFirst({
    where: (writeups, { eq }) => eq(writeups.id, id),
  });

  if (!existingWriteup) {
    return c.json(error('Writeup not found'), 404);
  }

  if (!(user.role === 'admin' || user.id === existingWriteup.createdBy)) {
    return c.json(error('Unauthorized'), 403);
  }

  let existingTags = await db.query.tags.findFirst({
    where: (tags, { eq }) => eq(tags.name, name)
  });

  if (!existingTags) {
    const [ newTag ] = await db.insert(tags).values({ name }).returning();
    existingTags = newTag;
  }

  await db.insert(writeupToTags).values(
    { writeupId: id, tagId: existingTags.id }
  ).onConflictDoNothing();

  return c.json(success(existingTags), 201);
});

const deleteWriteupTagsHandlers = factory.createHandlers(withAuth(true), withValidates({ param: idParamSchema, json: writeupTagDeleteSchema }), async (c) => {
  try {} catch { return null as unknown as withAuthErrorResponse | withValidatesErrorResponse; }

  const db = getDB(c.env.DB);
  const id = Number(c.req.valid('param').id);
  const { id: tagId } = c.req.valid('json');
  const user = c.get('user');

  const existingWriteup = await db.query.writeups.findFirst({
    where: (writeups, { eq }) => eq(writeups.id, id),
  });

  if (!existingWriteup) {
    return c.json(error('Writeup not found'), 404);
  }

  if (!(user.role === 'admin' || user.id === existingWriteup.createdBy)) {
    return c.json(error('Unauthorized'), 403);
  }

  await db.delete(writeupToTags).where(and(
    eq(writeupToTags.writeupId, id),
    eq(writeupToTags.tagId, tagId)
  )).execute();

  return c.json(success(), 200);
});

const getWriteupContentHandlers = factory.createHandlers(withAuth(false), withValidates({ param: idParamSchema, header: writeupPasswordHeaderSchema }), async (c) => {
  try{} catch{ return null as unknown as withValidatesErrorResponse; }

  const db = getDB(c.env.DB);
  const user = c.get('user');
  const id = Number(c.req.valid('param').id);
  const password = c.req.valid('header')['x-password'];

  const writeup = await db.query.writeups.findFirst({
    where: (writeups, { eq }) => eq(writeups.id, id)
  });

  if (!writeup) {
    return c.json(error('Writeup not found'), 404);
  }

  if (writeup.password) {
    if (!(user && (user.id === writeup.createdBy || user.role === 'admin'))) {
      if (!password) {
        return c.json(error('Unauthorized'), 403);
      }
      const hash = await getHash(password);
      if (hash !== writeup.password) {
        return c.json(error('Unauthorized'), 403);
      }
    }
  }

  const html = await markdownToHtml(writeup.content);
  return c.html(html, 200);
});

const patchWriteupHandlers = factory.createHandlers(withAuth(true), withValidates({ param: idParamSchema, json: writeupUpdateBodySchema }), async (c) => {
  try {} catch { return null as unknown as withAuthErrorResponse | withValidatesErrorResponse; }

  const db = getDB(c.env.DB);
  const id = Number(c.req.valid('param').id);
  const { title, categoryId, points, solvers, password } = c.req.valid('json');
  const user = c.get('user');

  const existingWriteup = await db.query.writeups.findFirst({
    where: (writeups, { eq }) => eq(writeups.id, id),
  });

  if (!existingWriteup) {
    return c.json(error('Writeup not found'), 404);
  }

  if (!(user.role === 'admin' || user.id === existingWriteup.createdBy)) {
    return c.json(error('Unauthorized'), 403);
  }

  const [ writeup ] = await db.update(writeups).set({
    title,
    categoryId,
    points,
    solvers,
    password: password ? await getHash(password) : undefined,
  }).where(eq(writeups.id, id)).returning();
  if (!writeup) {
    return c.json(error('Failed to update writeup'), 500);
  }

  return c.json(success({
    ...writeup,
    password: undefined,
  }), 200);
});

const patchWriteupContentHandlers = factory.createHandlers(withAuth(true), withValidates({ param: idParamSchema, json: writeupContentSchema }), async (c) => {
  try {} catch { return null as unknown as withAuthErrorResponse | withValidatesErrorResponse; }

  const db = getDB(c.env.DB);
  const id = Number(c.req.valid('param').id);
  const { content } = c.req.valid('json');
  const user = c.get('user');

  const existingWriteup = await db.query.writeups.findFirst({
    where: (writeups, { eq }) => eq(writeups.id, id),
  });

  if (!existingWriteup) {
    return c.json(error('Writeup not found'), 404);
  }

  if (!(user.role === 'admin' || user.id === existingWriteup.createdBy)) {
    return c.json(error('Unauthorized'), 403);
  }

  const [writeup] = await db.update(writeups).set({
    content
  }).where(eq(writeups.id, id)).returning();
  if (!writeup) {
    return c.json(error('Failed to update writeup'), 500);
  }

  return c.json(success({
    ...writeup,
    password: undefined,
  }), 200);
});

const deleteWriteupHandlers = factory.createHandlers(withAuth(true), withValidates({ param: idParamSchema }), async (c) => {
  try {} catch { return null as unknown as withAuthErrorResponse | withValidatesErrorResponse; }

  const db = getDB(c.env.DB);
  const id = Number(c.req.valid('param').id);
  const user = c.get('user');

  const existingWriteup = await db.query.writeups.findFirst({
    where: eq(writeups.id, id),
  });

  if (!existingWriteup) {
    return c.json(error('Writeup not found'), 404);
  }

  if (!(user.role === 'admin' || user.id === existingWriteup.createdBy)) {
    return c.json(error('Unauthorized'), 403);
  }

  await db.delete(writeupToTags).where(eq(writeupToTags.writeupId, id)).execute();
  await db.delete(writeups).where(eq(writeups.id, id)).execute();

  return c.json(success(), 200);
});

const router = new Hono<Env>()
  .get('/', ...getWriteupsHandlers)
  .post('/', ...postWriteupHandlers)
  .get('/:id', ...getWriteupHandlers)
  .get('/:id/tags', ...getWriteupTagsHandlers)
  .post('/:id/tags', ...postWriteupTagsHandlers)
  .delete('/:id/tags', ...deleteWriteupTagsHandlers)
  .get('/:id/content', ...getWriteupContentHandlers)
  .patch('/:id', ...patchWriteupHandlers)
  .patch('/:id/content', ...patchWriteupContentHandlers)
  .delete('/:id', ...deleteWriteupHandlers);

export { router };
