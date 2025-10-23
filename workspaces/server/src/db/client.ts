import { drizzle } from "drizzle-orm/d1";

import * as schema from "./schema";

export const getDB = (DB: D1Database) => {
  return drizzle(DB, {
    schema,
  });
};
