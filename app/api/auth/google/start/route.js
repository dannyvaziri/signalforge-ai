import { appOrigin, cookie, GOOGLE_STATE_COOKIE, randomState, redirect } from '../../../../../lib/session.js';

export async function GET(request) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.AUTH_SECRET) {
    return redirect(`${appOrigin(request)}/?auth=google-config`);
  }

  const state = randomState();
  const callback = `${appOrigin(request)}/api/auth/google/callback`;
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID);
  url.searchParams.set('redirect_uri', callback);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('state', state);
  url.searchParams.set('prompt', 'select_account');

  return redirect(url.toString(), [cookie(GOOGLE_STATE_COOKIE, state, 600)]);
}
