import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";
import { sign } from "hono/jwt";
import { z } from "zod";

import { getDB } from "@/db/client";
import { inviteTokens, users } from "@/db/schema";
import { getAvatarUrl, getDiscordToken, getDiscordUser, makeRedirectUrl } from "@/libs/discord";
import { withValidates } from "@/middlewares/validate";

const SESSION_EXPIRE_SECONDS = 60 * 60 * 24 * 7; // 7 days

const tokenFormSchema = z.object({
  inviteToken: z.string().optional(),
});
const callbackQuerySchema = z.object({
  code: z.string(),
  state: z.string(),
});

const makeAppUrl = (error?: string): string => {
  if (error) {
    return `/login?error=${encodeURIComponent(error)}`;
  }
  return "/";
};

const router = new Hono<Env>()
  .post("/login", withValidates({ form: tokenFormSchema }, makeAppUrl), async c => {
    const inviteToken = c.req.valid("form").inviteToken || "";

    const redirectUri = makeRedirectUrl(c.env, inviteToken);
    return c.redirect(redirectUri);
  })
  .get("/callback", withValidates({ query: callbackQuerySchema }, makeAppUrl), async c => {
    const { code, state } = c.req.valid("query");

    let inviteToken: string | undefined;
    try {
      const decodedState = JSON.parse(atob(state));
      inviteToken = decodedState.inviteToken;
    } catch (_e) {
      return c.redirect(makeAppUrl("Invalid state data"));
    }

    if (typeof inviteToken !== "string") {
      return c.redirect(makeAppUrl("Invalid state data"));
    }

    try {
      const token = await getDiscordToken(c.env, code);
      if (!token) {
        return c.redirect(makeAppUrl("Failed to get Discord token"));
      }

      const discordUser = await getDiscordUser(token);
      if (!discordUser) {
        return c.redirect(makeAppUrl("Failed to get Discord user"));
      }

      const db = getDB(c.env);
      const user = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, discordUser.id),
      });

      if (user) {
        const session = await sign(
          {
            exp: Math.floor(Date.now() / 1000) + SESSION_EXPIRE_SECONDS,
            data: { id: user.id },
          },
          c.env.JWT_SECRET,
          "HS256",
        );

        setCookie(c, "session", session, {
          httpOnly: true,
          sameSite: "lax",
          maxAge: SESSION_EXPIRE_SECONDS,
        });

        return c.redirect(makeAppUrl());
      } else {
        if (!inviteToken) {
          return c.redirect(makeAppUrl("Invite token is required for new users"));
        }

        const existInviteToken = await db.query.inviteTokens.findFirst({
          where: (inviteTokens, { eq, and, gte }) =>
            and(
              eq(inviteTokens.token, inviteToken),
              eq(inviteTokens.used, 0),
              gte(inviteTokens.expiresAt, new Date(Date.now())),
            ),
        });

        if (!existInviteToken) {
          return c.redirect(makeAppUrl("Invalid or expired invite token"));
        }

        const txResult = await db.batch([
          db
            .insert(users)
            .values({
              id: discordUser.id,
              name: discordUser.username,
              avatarUrl: getAvatarUrl(discordUser),
              role: existInviteToken.role,
            })
            .returning(),
          db.update(inviteTokens).set({ used: 1 }).where(eq(inviteTokens.token, inviteToken)),
        ]);

        if (!txResult || txResult.length !== 2 || txResult[1].rowsAffected !== 1) {
          return c.redirect(makeAppUrl("Failed to create user or update invite token"));
        }

        const session = await sign(
          {
            exp: Math.floor(Date.now() / 1000) + SESSION_EXPIRE_SECONDS,
            data: { id: discordUser.id },
          },
          c.env.JWT_SECRET,
          "HS256",
        );

        setCookie(c, "session", session, {
          httpOnly: true,
          sameSite: "lax",
          maxAge: SESSION_EXPIRE_SECONDS,
        });

        return c.redirect("/");
      }
    } catch (e) {
      console.error("Error during authentication:", e);
      return c.redirect(makeAppUrl("Authentication failed"));
    }
  })
  .get("/logout", async c => {
    deleteCookie(c, "session", {
      httpOnly: true,
      sameSite: "lax",
    });
    return c.redirect(makeAppUrl());
  });

export { router };
