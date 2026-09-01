import { ALPACA_STATE_COOKIE, appOrigin, cookie, randomState, readSealedCookie, redirect, SESSION_COOKIE } from '../../../../../lib/session.js';

export async function GET(request) {
  const origin = appOrigin(request);
  const user = readSealedCookie(request, SESSION_COOKIE);
  if (!user) return redirect(`${origin}/?step=1`);

  if (!process.env.ALPACA_OAUTH_CLIENT_ID || !process.env.ALPACA_OAUTH_CLIENT_SECRET || !process.env.AUTH_SECRET) {
    return redirect(`${origin}/?broker=alpaca-config`);
  }

  const state = randomState();
  const callback = `${origin}/api/broker/alpaca/callback`;
  const url = new URL('https://app.alpaca.markets/oauth/authorize');
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', process.env.ALPACA_OAUTH_CLIENT_ID);
  url.searchParams.set('redirect_uri', callback);
  url.searchParams.set('state', state);
  url.searchParams.set('scope', 'account:write trading data');
  url.searchParams.set('env', 'paper');

  return redirect(url.toString(), [cookie(ALPACA_STATE_COOKIE, state, 600)]);
}
