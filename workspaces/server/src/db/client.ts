import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import type { Bindings } from "../types.js";
import * as schema from "./schema.js";

export const getDB = (env: Bindings) => {
  const client = createClient({
    url: env.TURSO_CONNECTION_URL,
    authToken: env.TURSO_AUTH_TOKEN,
  });
  return drizzle(client, { schema });
};
