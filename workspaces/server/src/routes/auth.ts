import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { deleteCookie, setCookie } from 'hono/cookie';
import { sign } from 'hono/jwt';
import { z } from 'zod';

import { getDB } from '@/db/client';
import { inviteTokens, users } from '@/db/schema';
import { getAvatarUrl, getDiscordToken, getDiscordUser, makeRedirectUrl } from '@/libs/discord';
import { error } from '@/libs/response';

const router = new Hono<Env>();

const tokenFormSchema = z.object({
  inviteToken: z.string().optional(),
});
const callbackQuerySchema = z.object({
  code: z.string(),
  state: z.string(),
});

const validateTokenForm = zValidator('form', tokenFormSchema, (res, c) =>
  !res.success ? c.json(error('Invalid form data'), 400) : undefined
);
const validateCallbackQuery = zValidator('query', callbackQuerySchema, (res, c) =>
  !res.success ? c.json(error('Missing code or state'), 400) : undefined
);

router.post('/login', validateTokenForm, async (c) => {
  const inviteToken = c.req.valid('form').inviteToken || '';

  const redirectUri = makeRedirectUrl(c.env, inviteToken);
  return c.redirect(redirectUri);
});

router.get('/callback', validateCallbackQuery, async (c) => {
  const { code, state } = c.req.valid('query');

  let inviteToken: string | undefined;
  try {
    const decodedState = JSON.parse(atob(state));
    inviteToken = decodedState.inviteToken;
  } catch (e) {
    return c.json(error('Invalid state data'), 400);
  }

  if (typeof inviteToken !== 'string') {
    return c.json(error('Invalid state data'), 400);
  }

  try {
    const token = await getDiscordToken(c.env, code);
    if (!token) {
      return c.json(error('Failed to get Discord token'), 500);
    }

    const discordUser = await getDiscordUser(token);
    if (!discordUser) {
      return c.json(error('Failed to get Discord user'), 500);
    }

    const db = getDB(c.env.DB);
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, discordUser.id),
    });

    if (user) {
      const session = await sign({
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
        data: { id: user.id }
      }, c.env.JWT_SECRET, 'HS256');

      setCookie(c, 'session', session, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24,
      });

      return c.redirect('/');
    }
    else {
      if (!inviteToken) {
        return c.json(error('Invite token is required for new users'), 400);
      }

      const existInviteToken = await db.query.inviteTokens.findFirst({
        where: (inviteTokens, { eq, and, gte }) => 
          and(eq(inviteTokens.token, inviteToken), eq(inviteTokens.used, 0), gte(inviteTokens.expiresAt, new Date(Date.now()))),
      });

      if (!existInviteToken) {
        return c.json(error('Invalid or expired invite token'), 400);
      }

      const txResult = await db.batch([
        db.insert(users).values({
          id: discordUser.id,
          name: discordUser.username,
          avatarUrl: getAvatarUrl(discordUser),
          role: existInviteToken.role,
        }).returning(),
        db.update(inviteTokens)
          .set({ used: 1 })
          .where(eq(inviteTokens.token, inviteToken))
      ]);
      
      if (!txResult || txResult.length !== 2 || !txResult[1].success) {
        return c.json(error('Failed to create user or update invite token'), 500);
      }

      const session = await sign({
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
        data: { id: discordUser.id }
      }, c.env.JWT_SECRET, 'HS256');

      setCookie(c, 'session', session, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24,
      });

      return c.redirect('/');
    }
  } catch (e) {
    console.error('Error during authentication:', e);
    return c.json(error('Authentication failed'), 500);
  }
});

router.get('/logout', (c) => {
  deleteCookie(c, 'session', {
    httpOnly: true,
    sameSite: 'lax',
  });
  return c.redirect('/');
});

export { router };
