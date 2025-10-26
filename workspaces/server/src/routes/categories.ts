import { DrizzleQueryError, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import { getDB } from "@/db/client";
import { categories } from "@/db/schema";
import { error, success } from "@/libs/response";
import { withAuth } from "@/middlewares/auth";
import { withValidates } from "@/middlewares/validate";

const idParamSchema = z.object({ id: z.string().regex(/^\d+$/, "ID must be numeric") });
const categoryBodySchema = z.object({
  name: z.string().min(1, "Name is required"),
  color: z.string().regex(/^#([0-9A-F]{3}|[0-9A-F]{6})$/, "Color must be a valid hex code"),
});

const router = new Hono<Env>()
  .get("/", async (c) => {
    const db = getDB(c.env.DB);
    const list = await db.query.categories.findMany();
    return c.json(success(list), 200);
  })
  .post("/", withAuth(true, true), withValidates({ json: categoryBodySchema }), async (c) => {
    const db = getDB(c.env.DB);
    const { name, color } = c.req.valid("json");
    try {
    const [category] = await db.insert(categories).values({ name, color }).returning();
    return c.json(success(category), 201);
    } catch (e) {
      if (e instanceof DrizzleQueryError) {
        if (e.cause?.message.includes("UNIQUE constraint failed: categories.name")) {
          return c.json(error("Category name already exists"), 400);
        }
      }
      console.error("Failed to create category:", e);
      return c.json(error("Failed to create category"), 500);
    }
  })
  .patch("/:id", withAuth(true, true), withValidates({ param: idParamSchema, json: categoryBodySchema }), async (c) => {
    const db = getDB(c.env.DB);
    const id = Number(c.req.valid("param").id);
    const { name, color } = c.req.valid("json");
    try {
    const [category] = await db.update(categories).set({ name, color }).where(eq(categories.id, id)).returning();
    if (!category) {
      return c.json(error("Category not found"), 404);
    }
    return c.json(success(category), 200);
    } catch (e) {
      if (e instanceof DrizzleQueryError) {
        if (e.cause?.message.includes("UNIQUE constraint failed: categories.name")) {
          return c.json(error("Category name already exists"), 400);
        }
      }
      console.error("Failed to update category:", e);
      return c.json(error("Failed to update category"), 500);
    }
  })
  .delete("/:id", withAuth(true, true), withValidates({ param: idParamSchema }), async (c) => {
    const db = getDB(c.env.DB);
    const id = Number(c.req.valid("param").id);
    const deleted = await db.delete(categories).where(eq(categories.id, id)).returning();
    if (deleted.length === 0) {
      return c.json(error("Category not found"), 404);
    }
    return c.json(success(), 200);
  });

export { router };
