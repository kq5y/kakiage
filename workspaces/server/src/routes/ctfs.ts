import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import { getDB } from "@/db/client";
import { ctfs } from "@/db/schema";
import { error, success } from "@/libs/response";
import { withAuth } from "@/middlewares/auth";
import { withValidates } from "@/middlewares/validate";

const idParamSchema = z.object({ id: z.string().regex(/^\d+$/, "ID must be numeric") });
const ctfSearchQuerySchema = z.object({
  pageSize: z.number().min(1).max(100).optional(),
  page: z.number().min(1).optional(),
  sortKey: z.enum(["startAt", "endAt", "createdAt"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});
const ctfBodySchema = z.object({
  name: z.string().min(1, "Name is required"),
  url: z.url(),
  startAt: z.number(),
  endAt: z.number(),
});

const router = new Hono<Env>()
  .get("/", withValidates({ query: ctfSearchQuerySchema }), async (c) => {
    const db = getDB(c.env.DB);
    const { pageSize, page, sortKey, sortOrder } = c.req.valid("query");

    const list = await db.query.ctfs.findMany({
      limit: pageSize || 10,
      offset: ((page || 1) - 1) * (pageSize || 10),
      orderBy: (ctfs, { desc, asc }) => [
        sortOrder === "asc" ? asc(ctfs[sortKey || "startAt"]) : desc(ctfs[sortKey || "startAt"])
      ]
    });
    return c.json(success(list), 200);
  })
  .post("/", withAuth(true), withValidates({ json: ctfBodySchema }), async (c) => {
    const db = getDB(c.env.DB);
    const { name, url, startAt, endAt } = c.req.valid("json");
    const [ctf] = await db
      .insert(ctfs)
      .values({
        name,
        url,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
      })
      .returning();
    return c.json(success(ctf), 201);
  })
  .get("/:id", withAuth(true), withValidates({ param: idParamSchema }), async (c) => {
    const db = getDB(c.env.DB);
    const id = Number(c.req.valid("param").id);
    const ctf = await db.query.ctfs.findFirst({
      where: eq(ctfs.id, id),
      with: {
        writeups: {
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
              },
            },
          },
        },
      },
    });
    if (!ctf) {
      return c.json(error("CTF not found"), 404);
    }
    const ctfWithTags = {
      ...ctf,
      writeups: (ctf?.writeups ?? []).map((w) => ({
        ...w,
        tags: (w.writeupToTags ?? []).map((wt) => wt.tag),
        writeupToTags: undefined,
      })),
    };
    return c.json(success(ctfWithTags), 200);
  })
  .patch("/:id", withAuth(true), withValidates({ param: idParamSchema, json: ctfBodySchema }), async (c) => {
    const db = getDB(c.env.DB);
    const id = Number(c.req.valid("param").id);
    const { name, url, startAt, endAt } = c.req.valid("json");
    const [ctf] = await db
      .update(ctfs)
      .set({
        name,
        url,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
      })
      .where(eq(ctfs.id, id))
      .returning();
    if (!ctf) {
      return c.json(error("CTF not found"), 404);
    }
    return c.json(success(ctf), 200);
  })
  .delete("/:id", withAuth(true, true), withValidates({ param: idParamSchema }), async (c) => {
    const db = getDB(c.env.DB);
    const id = Number(c.req.valid("param").id);
    const deleted = await db.delete(ctfs).where(eq(ctfs.id, id)).returning();
    if (deleted.length === 0) {
      return c.json(error("CTF not found"), 404);
    }
    return c.json(success(), 200);
  });

export { router };
