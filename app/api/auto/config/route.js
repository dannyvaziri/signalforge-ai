import { AUTO_COOKIE, BROKER_COOKIE, cookie, readSealedCookie, seal, SESSION_COOKIE } from '../../../../lib/session.js';

const PRESETS = {
  conservative: { maxOrderNotional: 500, maxPositionPct: 3, maxDailyLossPct: 0.75, minConfidence: 93, minImpact: 8.5 },
  balanced: { maxOrderNotional: 1000, maxPositionPct: 5, maxDailyLossPct: 1, minConfidence: 90, minImpact: 8 },
  growth: { maxOrderNotional: 1500, maxPositionPct: 7.5, maxDailyLossPct: 1.5, minConfidence: 88, minImpact: 8 },
};

export async function POST(request) {
  const user = readSealedCookie(request, SESSION_COOKIE);
  const broker = readSealedCookie(request, BROKER_COOKIE);
  if (!user) return Response.json({ error: 'Sign in first.' }, { status: 401 });
  if (!broker || !broker.paper) return Response.json({ error: 'Connect a paper broker first.' }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const preset = String(body.preset || 'balanced');
  const selected = PRESETS[preset];
  if (!selected) return Response.json({ error: 'Invalid preset.' }, { status: 400 });

  const active = body.active === true;
  const config = {
    active,
    preset,
    ...selected,
    paperOnly: true,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };

  const headers = new Headers({ 'Content-Type': 'application/json' });
  headers.append('Set-Cookie', cookie(AUTO_COOKIE, seal(config)));
  return new Response(JSON.stringify({ ok: true, auto: config }), { status: 200, headers });
}
