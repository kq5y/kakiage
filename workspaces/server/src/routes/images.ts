import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import { getDB } from "@/db/client";
import { images } from "@/db/schema";
import { convertImageFromBuffer, hashArrayBufferToHex } from "@/libs/image";
import { error, success } from "@/libs/response";
import { withAuth } from "@/middlewares/auth";
import { withValidates } from "@/middlewares/validate";

const MAX_SIZE = 10 * 1024 * 1024;

const idParamSchema = z.object({
  id: z.uuid(),
});
const imageFormSchema = z.object({
  image: z.instanceof(File).refine(file => file.size > 0 && file.size < MAX_SIZE && file.type.startsWith("image/")),
});

const router = new Hono<Env>()
  .post("/upload", withAuth(true), withValidates({ form: imageFormSchema }), async c => {
    const user = c.get("user");
    const db = getDB(c.env);

    const form = c.req.valid("form");
    const file = form.image;
    const arrayBuffer = await file.arrayBuffer();

    const hashPromise = hashArrayBufferToHex(arrayBuffer);
    const convertPromise = convertImageFromBuffer(c.env, arrayBuffer, file.name, file.type, "avif");

    const hash = await hashPromise;

    const existing = await db.query.images.findFirst({ where: eq(images.originalHash, hash) });
    if (existing) {
      const imagePath = new URL(c.req.url).pathname.replace("/upload", `/${existing.id}`);
      return c.json(success({ id: existing.id, path: imagePath }), 200, { "X-Image-Duplicate": "true" });
    }

    let convertedFile: File;
    try {
      convertedFile = await convertPromise;
    } catch (err) {
      console.error("convert failed", err);
      return c.json(error("Image conversion failed"), 502);
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
      console.error("R2 put failed", err);
      return c.json(error("Storage failed"), 500);
    }

    try {
      await db.insert(images).values({
        id,
        originalHash: hash,
        createdBy: user.id,
      });
    } catch (dbErr) {
      console.error("DB insert failed, rolling back R2", dbErr);
      try {
        await c.env.R2_IMG.delete(id);
      } catch (delErr) {
        console.error("R2 delete after DB failure also failed", delErr);
      }
      return c.json(error("Storage failed"), 500);
    }

    const imagePath = new URL(c.req.url).pathname.replace("/upload", `/${id}`);
    return c.json(success({ id: id, path: imagePath }), 201, { Location: imagePath });
  })
  .get("/:id", withValidates({ param: idParamSchema }), async c => {
    const id = c.req.valid("param").id;

    const cacheKey = new Request(`${c.req.url}`);
    const cache = caches.default;
    const cached = await cache.match(cacheKey);
    if (cached) {
      return cached;
    }

    const db = getDB(c.env);
    const imageRow = await db.query.images.findFirst({ where: eq(images.id, id) });
    if (!imageRow) return c.json(error("Image not found"), 404);

    const avifImage = await c.env.R2_IMG.get(id);
    if (!avifImage) return c.json(error("Image not found"), 404);

    const arrayBuffer: ArrayBuffer = await avifImage.arrayBuffer();
    const etag = imageRow.originalHash;

    const headers = {
      "Content-Type": avifImage.httpMetadata?.contentType || "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
      ETag: etag,
    };

    c.executionCtx.waitUntil(
      cache.put(
        cacheKey,
        new Response(arrayBuffer, {
          status: 200,
          headers,
        }),
      ),
    );
    return c.body(arrayBuffer, 200, headers);
  });

export { router };
