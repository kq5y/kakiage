import { hc, parseResponse, type DetailedError, type InferRequestType } from 'hono/client';

import type { Category, CTF, Image, InviteToken, Role, Tag, User, Writeup, WriteupToTag } from '@/db/schema';
import app from "@/index";

export { parseResponse, type DetailedError, type InferRequestType };

export const hcWithType = (...args: Parameters<typeof hc>) => hc<typeof app>(...args);

export type { Category, CTF, Image, InviteToken, Role, Tag, User, Writeup, WriteupToTag };
