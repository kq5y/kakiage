import { hc, type InferRequestType } from 'hono/client';

import type { Category, CTF, Image, InviteToken, Role, Tag, User, Writeup, WriteupToTag } from '@/db/schema';
import app from "@/index";

const client = hc<typeof app>('');
export type Client = typeof client;

export type { InferRequestType };

export const hcWithType = (...args: Parameters<typeof hc>): Client => hc<typeof app>(...args);

export type { Category, CTF, Image, InviteToken, Role, Tag, User, Writeup, WriteupToTag };
