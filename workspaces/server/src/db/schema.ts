import { relations, sql } from "drizzle-orm";
import { integer, primaryKey, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

const commonDatetimes = {
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdateFn(() => new Date())
    .$type<Date>(),
};

export const roles = ["admin", "user"] as const;
export type Role = (typeof roles)[number];

export const users = sqliteTable("users", {
  id: text("id").primaryKey().notNull(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url").notNull(),
  role: text("role", { enum: roles }).notNull().default("user"),
  ...commonDatetimes,
});
export type User = typeof users.$inferSelect;

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }).notNull(),
  name: text("name").notNull().unique(),
  color: text("color").notNull(),
  ...commonDatetimes,
});
export type Category = typeof categories.$inferSelect;

export const tags = sqliteTable("tags", {
  id: integer("id").primaryKey({ autoIncrement: true }).notNull(),
  name: text("name").notNull().unique(),
  ...commonDatetimes,
});
export type Tag = typeof tags.$inferSelect;

export const ctfs = sqliteTable("ctfs", {
  id: integer("id").primaryKey({ autoIncrement: true }).notNull(),
  name: text("name").notNull(),
  url: text("url"),
  startAt: integer("start_at", { mode: "timestamp" }).notNull(),
  endAt: integer("end_at", { mode: "timestamp" }).notNull(),
  ...commonDatetimes,
});
export type CTF = typeof ctfs.$inferSelect;

export const writeups = sqliteTable(
  "writeups",
  {
    id: integer("id").primaryKey({ autoIncrement: true }).notNull(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    ctfId: integer("ctf_id")
      .notNull()
      .references(() => ctfs.id),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id),
    points: integer("points"),
    solvers: integer("solvers"),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id),
    password: text("password"),
    content: text("content").notNull(),
    ...commonDatetimes,
  },
  table => [unique().on(table.ctfId, table.slug)],
);
export type Writeup = typeof writeups.$inferSelect;

export const writeupToTags = sqliteTable(
  "writeup_to_tags",
  {
    writeupId: integer("writeup_id")
      .notNull()
      .references(() => writeups.id),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id),
    ...commonDatetimes,
  },
  table => [primaryKey({ columns: [table.writeupId, table.tagId] })],
);
export type WriteupToTag = typeof writeupToTags.$inferSelect;

export const inviteTokens = sqliteTable("invite_tokens", {
  token: text("token").primaryKey().notNull(),
  createdBy: text("created_by").references(() => users.id),
  role: text("role", { enum: roles }).notNull().default("user"),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch() + 86400)`),
  used: integer("used").notNull().default(0),
  ...commonDatetimes,
});
export type InviteToken = typeof inviteTokens.$inferSelect;

export const usersRelations = relations(users, ({ many }) => ({
  writeups: many(writeups),
  inviteTokens: many(inviteTokens),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  writeups: many(writeups),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  writeupToTags: many(writeupToTags),
}));

export const ctfsRelations = relations(ctfs, ({ many }) => ({
  writeups: many(writeups),
}));

export const writeupsRelations = relations(writeups, ({ one, many }) => ({
  ctf: one(ctfs, {
    fields: [writeups.ctfId],
    references: [ctfs.id],
  }),
  category: one(categories, {
    fields: [writeups.categoryId],
    references: [categories.id],
  }),
  createdByUser: one(users, {
    fields: [writeups.createdBy],
    references: [users.id],
  }),
  writeupToTags: many(writeupToTags),
}));

export const writeupToTagsRelations = relations(writeupToTags, ({ one }) => ({
  writeup: one(writeups, {
    fields: [writeupToTags.writeupId],
    references: [writeups.id],
  }),
  tag: one(tags, {
    fields: [writeupToTags.tagId],
    references: [tags.id],
  }),
}));

export const inviteTokensRelations = relations(inviteTokens, ({ one }) => ({
  createdByUser: one(users, {
    fields: [inviteTokens.createdBy],
    references: [users.id],
  }),
}));
