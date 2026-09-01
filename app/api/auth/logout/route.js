import { AUTO_COOKIE, BROKER_COOKIE, clearCookie, SESSION_COOKIE } from '../../../../lib/session.js';

export async function POST() {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  for (const name of [SESSION_COOKIE, BROKER_COOKIE, AUTO_COOKIE]) headers.append('Set-Cookie', clearCookie(name));
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}
