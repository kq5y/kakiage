import { markdownToHtml } from "@kakiage/processor";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import { getDB } from "@/db/client";
import { tags, writeups, writeupToTags } from "@/db/schema";
import { error, success } from "@/libs/response";
import { withAuth } from "@/middlewares/auth";
import { withValidates } from "@/middlewares/validate";

const idParamSchema = z.object({ id: z.string().regex(/^\d+$/, "ID must be numeric") });
const writeupSearchQuerySchema = z.object({
  q: z.string().min(1).max(100).optional(),
  categoryId: z.number().min(1).optional(),
  tag: z.string().min(1).max(100).optional(),
  pageSize: z.number().min(1).max(100).optional(),
  page: z.number().min(1).optional(),
  sortKey: z.enum(["createdAt", "updatedAt"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});
const writeupCreateBodySchema = z.object({
  title: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-zA-Z0-9_-]+$/),
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
  content: z.string().max(200_000),
});
const writeupTagPostSchema = z.object({
  name: z.string().min(1).max(100),
});
const writeupTagDeleteSchema = z.object({
  id: z.number().min(1),
});
const writeupPasswordHeaderSchema = z.object({
  "x-password": z.string().min(1).optional(),
});

async function getHash(text: string): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const router = new Hono<Env>()
  .get("/", withValidates({ query: writeupSearchQuerySchema }), async (c) => {
    const db = getDB(c.env.DB);
    const { q, categoryId, tag, pageSize, page, sortKey, sortOrder } = c.req.valid("query");

    let writeupIds: number[] | undefined;
    if (tag) {
      const tagRecord = await db.query.tags.findFirst({
        where: (tags, { eq }) => eq(tags.name, tag),
      });
      if (!tagRecord) {
        return c.json(error("Tag not found"), 404);
      }
      const writeupsByTagRecords = await db.query.writeupToTags.findMany({
        where: (writeupToTags, { eq }) => eq(writeupToTags.tagId, tagRecord.id),
      });
      writeupIds = writeupsByTagRecords.map((record) => record.writeupId);
      if (writeupIds.length === 0) {
        return c.json(error("No writeups found for this tag"), 404);
      }
    }

    const writeupsList = await db.query.writeups.findMany({
      limit: pageSize || 10,
      offset: ((page || 1) - 1) * (pageSize || 10),
      orderBy: (writeups, { asc, desc }) => [
        sortOrder === "asc" ? asc(writeups[sortKey || "createdAt"]) : desc(writeups[sortKey || "createdAt"]),
      ],
      where: (writeups, { and, eq, like, inArray }) =>
        and(
          q ? like(writeups.title, `%${q}%`) : undefined,
          categoryId ? eq(writeups.categoryId, categoryId) : undefined,
          writeupIds ? inArray(writeups.id, writeupIds) : undefined,
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
          },
        },
      },
    });

    const formattedWriteups = writeupsList.map((w) => ({
      ...w,
      tags: w.writeupToTags.map((wt) => wt.tag),
      writeupToTags: undefined,
    }));
    return c.json(success(formattedWriteups), 200);
  })
  .post("/", withAuth(true), withValidates({ json: writeupCreateBodySchema }), async (c) => {
    const db = getDB(c.env.DB);
    const { title, slug, ctfId, categoryId, points, solvers, password } = c.req.valid("json");
    const user = c.get("user");

    const [writeup] = await db
      .insert(writeups)
      .values({
        title,
        slug,
        ctfId,
        content: "",
        categoryId: categoryId,
        points: points,
        solvers: solvers,
        password: password ? await getHash(password) : undefined,
        createdBy: user.id,
      })
      .returning();

    return c.json(
      success({
        ...writeup,
        password: undefined,
      }),
      201,
    );
  })
  .get("/:id", withValidates({ param: idParamSchema }), async (c) => {
    const db = getDB(c.env.DB);
    const id = Number(c.req.valid("param").id);

    const writeup = await db.query.writeups.findFirst({
      where: (writeups, { eq }) => eq(writeups.id, id),
      columns: {
        content: false,
        categoryId: false,
        createdBy: false,
        password: false,
        ctfId: false,
      },
      with: {
        category: true,
        createdByUser: true,
        writeupToTags: {
          with: {
            tag: true,
          },
        },
        ctf: true,
      },
    });

    if (!writeup) {
      return c.json(error("Writeup not found"), 404);
    }

    const formattedWriteup = {
      ...writeup,
      tags: writeup.writeupToTags.map((wt) => wt.tag),
      writeupToTags: undefined,
    };

    return c.json(success(formattedWriteup), 200);
  })
  .get("/:id/tags", withValidates({ param: idParamSchema }), async (c) => {
    const db = getDB(c.env.DB);
    const id = Number(c.req.valid("param").id);

    const writeup = await db.query.writeups.findFirst({
      where: (writeups, { eq }) => eq(writeups.id, id),
      with: {
        writeupToTags: {
          with: {
            tag: true,
          },
        },
      },
      columns: {
        content: false,
        categoryId: false,
        createdBy: false,
      },
    });

    if (!writeup) {
      return c.json(error("Writeup not found"), 404);
    }

    const writeupTags = writeup.writeupToTags.map((wt) => wt.tag);
    return c.json(success(writeupTags), 200);
  })
  .post("/:id/tags", withAuth(true), withValidates({ param: idParamSchema, json: writeupTagPostSchema }), async (c) => {
    const db = getDB(c.env.DB);
    const id = Number(c.req.valid("param").id);
    const { name } = c.req.valid("json");
    const user = c.get("user");

    const existingWriteup = await db.query.writeups.findFirst({
      where: (writeups, { eq }) => eq(writeups.id, id),
    });

    if (!existingWriteup) {
      return c.json(error("Writeup not found"), 404);
    }

    if (!(user.role === "admin" || user.id === existingWriteup.createdBy)) {
      return c.json(error("Unauthorized"), 403);
    }

    let existingTags = await db.query.tags.findFirst({
      where: (tags, { eq }) => eq(tags.name, name),
    });

    if (!existingTags) {
      const [newTag] = await db.insert(tags).values({ name }).returning();
      existingTags = newTag;
    }

    await db.insert(writeupToTags).values({ writeupId: id, tagId: existingTags.id }).onConflictDoNothing();

    return c.json(success(existingTags), 201);
  })
  .delete(
    "/:id/tags",
    withAuth(true),
    withValidates({ param: idParamSchema, json: writeupTagDeleteSchema }),
    async (c) => {
      const db = getDB(c.env.DB);
      const id = Number(c.req.valid("param").id);
      const { id: tagId } = c.req.valid("json");
      const user = c.get("user");

      const existingWriteup = await db.query.writeups.findFirst({
        where: (writeups, { eq }) => eq(writeups.id, id),
      });

      if (!existingWriteup) {
        return c.json(error("Writeup not found"), 404);
      }

      if (!(user.role === "admin" || user.id === existingWriteup.createdBy)) {
        return c.json(error("Unauthorized"), 403);
      }

      await db
        .delete(writeupToTags)
        .where(and(eq(writeupToTags.writeupId, id), eq(writeupToTags.tagId, tagId)))
        .execute();

      return c.json(success(), 200);
    },
  )
  .get(
    "/:id/content",
    withAuth(false),
    withValidates({ param: idParamSchema, header: writeupPasswordHeaderSchema }),
    async (c) => {
      const db = getDB(c.env.DB);
      const user = c.get("user");
      const id = Number(c.req.valid("param").id);
      const password = c.req.valid("header")["x-password"];

      const writeup = await db.query.writeups.findFirst({
        where: (writeups, { eq }) => eq(writeups.id, id),
      });

      if (!writeup) {
        return c.json(error("Writeup not found"), 404);
      }

      if (writeup.password) {
        if (!(user && (user.id === writeup.createdBy || user.role === "admin"))) {
          if (!password) {
            return c.json(error("Unauthorized"), 403);
          }
          const hash = await getHash(password);
          if (hash !== writeup.password) {
            return c.json(error("Unauthorized"), 403);
          }
        }
      }

      const html = await markdownToHtml(writeup.content);
      return c.json(success(html), 200);
    },
  )
  .patch("/:id", withAuth(true), withValidates({ param: idParamSchema, json: writeupUpdateBodySchema }), async (c) => {
    const db = getDB(c.env.DB);
    const id = Number(c.req.valid("param").id);
    const { title, categoryId, points, solvers, password } = c.req.valid("json");
    const user = c.get("user");

    const existingWriteup = await db.query.writeups.findFirst({
      where: (writeups, { eq }) => eq(writeups.id, id),
    });

    if (!existingWriteup) {
      return c.json(error("Writeup not found"), 404);
    }

    if (!(user.role === "admin" || user.id === existingWriteup.createdBy)) {
      return c.json(error("Unauthorized"), 403);
    }

    const [writeup] = await db
      .update(writeups)
      .set({
        title,
        categoryId,
        points,
        solvers,
        password: password ? await getHash(password) : undefined,
      })
      .where(eq(writeups.id, id))
      .returning();
    if (!writeup) {
      return c.json(error("Failed to update writeup"), 500);
    }

    return c.json(
      success({
        ...writeup,
        password: undefined,
      }),
      200,
    );
  })
  .patch(
    "/:id/content",
    withAuth(true),
    withValidates({ param: idParamSchema, json: writeupContentSchema }),
    async (c) => {
      const db = getDB(c.env.DB);
      const id = Number(c.req.valid("param").id);
      const { content } = c.req.valid("json");
      const user = c.get("user");

      const existingWriteup = await db.query.writeups.findFirst({
        where: (writeups, { eq }) => eq(writeups.id, id),
      });

      if (!existingWriteup) {
        return c.json(error("Writeup not found"), 404);
      }

      if (!(user.role === "admin" || user.id === existingWriteup.createdBy)) {
        return c.json(error("Unauthorized"), 403);
      }

      const [writeup] = await db
        .update(writeups)
        .set({
          content,
        })
        .where(eq(writeups.id, id))
        .returning();
      if (!writeup) {
        return c.json(error("Failed to update writeup"), 500);
      }

      return c.json(
        success({
          ...writeup,
          password: undefined,
        }),
        200,
      );
    },
  )
  .delete("/:id", withAuth(true), withValidates({ param: idParamSchema }), async (c) => {
    const db = getDB(c.env.DB);
    const id = Number(c.req.valid("param").id);
    const user = c.get("user");

    const existingWriteup = await db.query.writeups.findFirst({
      where: eq(writeups.id, id),
    });

    if (!existingWriteup) {
      return c.json(error("Writeup not found"), 404);
    }

    if (!(user.role === "admin" || user.id === existingWriteup.createdBy)) {
      return c.json(error("Unauthorized"), 403);
    }

    await db.delete(writeupToTags).where(eq(writeupToTags.writeupId, id)).execute();
    await db.delete(writeups).where(eq(writeups.id, id)).execute();

    return c.json(success(), 200);
  });

export { router };
