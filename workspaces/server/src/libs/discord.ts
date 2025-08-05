export const makeRedirectUrl = (env: Bindings, inviteToken: string) => {
  const url = new URL('https://discord.com/oauth2/authorize');
  url.searchParams.set('client_id', env.DISCORD_CLIENT_ID);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('redirect_uri', `${env.APP_DOMAIN}/api/v1/auth/callback`);
  url.searchParams.set('scope', 'identify');
  url.searchParams.set('state', btoa(JSON.stringify({ inviteToken })));
  return url.toString();
}

export const getAvatarUrl = (discordUser: { avatar: string | null, id: string }) => {
  if (!discordUser.avatar) {
    return `https://cdn.discordapp.com/embed/avatars/${parseInt(discordUser.id) % 5}.png`;
  }
  return `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}`;
}

export const getDiscordToken = async (env: Bindings, code: string) => {
  const response = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: env.DISCORD_CLIENT_ID,
      client_secret: env.DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: `${env.APP_DOMAIN}/api/v1/auth/callback`,
    }),
  });
  
  if (!response.ok) {
    console.log(await response.text(), env.DISCORD_CLIENT_ID, env.DISCORD_CLIENT_SECRET);
    throw new Error(`Failed to fetch Discord token: ${response.statusText}`);
  }

  const data = await response.json<{
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
  }>();
  return data.access_token;
}

export const getDiscordUser = async (token: string) => {
  const response = await fetch('https://discord.com/api/users/@me', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Discord user: ${response.statusText}`);
  }

  const data = await response.json<{
    id: string;
    username: string;
    avatar: string | null;
    verified: boolean;
  }>();
  return data;
}
