import { type DetailedError, hc, type InferRequestType, parseResponse } from "hono/client";

import type { Category, CTF, InviteToken, Role, Tag, User, Writeup, WriteupToTag } from "./db/schema.js";
import type app from "./index.js";

export { parseResponse, type DetailedError, type InferRequestType };

export const hcWithType = (...args: Parameters<typeof hc>) => hc<typeof app>(...args);

export type { Category, CTF, InviteToken, Role, Tag, User, Writeup, WriteupToTag };
