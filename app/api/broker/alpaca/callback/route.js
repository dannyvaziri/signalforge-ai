import { ALPACA_STATE_COOKIE, appOrigin, BROKER_COOKIE, clearCookie, cookie, parseCookies, readSealedCookie, redirect, seal, SESSION_COOKIE } from '../../../../../lib/session.js';

export async function GET(request) {
  const origin = appOrigin(request);
  const user = readSealedCookie(request, SESSION_COOKIE);
  if (!user) return redirect(`${origin}/?step=1`);

  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const savedState = parseCookies(request)[ALPACA_STATE_COOKIE];

  if (!code || !state || !savedState || state !== savedState) {
    return redirect(`${origin}/?broker=alpaca-error`, [clearCookie(ALPACA_STATE_COOKIE)]);
  }

  try {
    const callback = `${origin}/api/broker/alpaca/callback`;
    const tokenRes = await fetch('https://api.alpaca.markets/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: process.env.ALPACA_OAUTH_CLIENT_ID || '',
        client_secret: process.env.ALPACA_OAUTH_CLIENT_SECRET || '',
        redirect_uri: callback,
      }),
      cache: 'no-store',
    });
    if (!tokenRes.ok) throw new Error('Alpaca token exchange failed.');
    const token = await tokenRes.json();
    if (!token.access_token) throw new Error('Alpaca returned no access token.');

    const accountRes = await fetch('https://paper-api.alpaca.markets/v2/account', {
      headers: { Authorization: `Bearer ${token.access_token}` },
      cache: 'no-store',
    });
    if (!accountRes.ok) throw new Error('The authorized account is not available through Alpaca Paper.');
    const account = await accountRes.json();

    const broker = seal({
      id: 'alpaca',
      name: 'Alpaca',
      paper: true,
      accessToken: token.access_token,
      accountId: account.id || '',
      accountStatus: account.status || '',
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    return redirect(`${origin}/?broker=connected`, [
      cookie(BROKER_COOKIE, broker),
      clearCookie(ALPACA_STATE_COOKIE),
    ]);
  } catch {
    return redirect(`${origin}/?broker=alpaca-error`, [clearCookie(ALPACA_STATE_COOKIE)]);
  }
}
