import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { createFactory } from 'hono/factory';
import { z } from 'zod';

import { getDB } from '@/db/client';
import { images } from '@/db/schema';
import { convertImageFromBuffer, hashArrayBufferToHex } from '@/libs/image';
import { error, success } from '@/libs/response';
import { authMiddleware } from '@/middlewares/auth';

const MAX_SIZE = 10 * 1024 * 1024;

const factory = createFactory<Env>();

const idParamSchema = z.object({
  id: z.uuid(),
});
const imageFormSchema = z.object({
  image: z.instanceof(File).refine((file) => file.size > 0 && file.size < MAX_SIZE && file.type.startsWith('image/'))
});

const validateIdParam = zValidator('param', idParamSchema, (res, c) =>
  !res.success ? c.json(error('Invalid ID format'), 400) : undefined
);
const validateImageForm = zValidator('form', imageFormSchema, (res, c) =>
  !res.success ? c.json(error('Invalid image file'), 400) : undefined
);

const postUploadHandlers = factory.createHandlers(authMiddleware(), validateImageForm, async (c) => {
  const user = c.get('user');
  const db = getDB(c.env.DB);

  const form = c.req.valid('form');
  const file = form.image;
  const arrayBuffer = await file.arrayBuffer();

  const hashPromise = hashArrayBufferToHex(arrayBuffer);
  const convertPromise = convertImageFromBuffer(c.env, arrayBuffer, file.name, file.type, 'avif');

  const hash = await hashPromise;

  const existing = await db.query.images.findFirst({ where: eq(images.originalHash, hash) });
  if (existing) {
    return c.json(success({ id: existing.id, hash: hash }), 200, { 'X-Image-Duplicate': 'true' });
  }

  let convertedFile: File;
  try {
    convertedFile = await convertPromise;
  } catch (err) {
    console.error('convert failed', err);
    return c.json(error('Image conversion failed'), 502);
  }

  const id = crypto.randomUUID();

  try {
    const convertedBuffer = await convertedFile.arrayBuffer();
    await c.env.R2_IMG.put(id, convertedBuffer, {
      httpMetadata: {
        contentType: convertedFile.type,
      },
    });
  } catch (err) {
    console.error('R2 put failed', err);
    return c.json(error('Storage failed'), 500);
  }

  try {
    await db.insert(images).values({
      id,
      originalHash: hash,
      createdBy: user.id,
    });
  } catch (dbErr) {
    console.error('DB insert failed, rolling back R2', dbErr);
    try {
      await c.env.R2_IMG.delete(id);
    } catch (delErr) {
      console.error('R2 delete after DB failure also failed', delErr);
    }
    return c.json(error('Storage failed'), 500);
  }

  const imagePath = new URL(c.req.url).pathname.replace('/upload', `/${id}`);
  return c.json(success({ id: id, path: imagePath }), 201, {Location: imagePath});
});

const getHandlers = factory.createHandlers(validateIdParam, async (c) => {
  const id = c.req.valid('param').id;

  const cacheKey = new Request(`${c.req.url}`);
  const cache = caches.default;
  const cached = await cache.match(cacheKey);
  if (cached) {
    return cached;
  }

  const db = getDB(c.env.DB);
  const imageRow = await db.query.images.findFirst({ where: eq(images.id, id) });
  if (!imageRow) return c.json(error('Image not found'), 404);

  const avifImage = await c.env.R2_IMG.get(id);
  if (!avifImage) return c.json(error('Image not found'), 404);

  const arrayBuffer = await avifImage.arrayBuffer();
  const etag = imageRow.originalHash;

  const resp = new Response(arrayBuffer, {
    status: 200,
    headers: {
      'Content-Type': avifImage.httpMetadata?.contentType || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'ETag': etag,
    },
  });

  c.executionCtx.waitUntil(cache.put(cacheKey, resp.clone()));
  return resp;
});

const router = new Hono<Env>()
  .post('/upload', ...postUploadHandlers)
  .get('/:id', ...getHandlers);

export { router };
