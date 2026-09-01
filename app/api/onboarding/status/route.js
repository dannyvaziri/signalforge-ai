import { AUTO_COOKIE, BROKER_COOKIE, readSealedCookie, SESSION_COOKIE } from '../../../../lib/session.js';
import { brokerById } from '../../../../lib/brokers.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const user = readSealedCookie(request, SESSION_COOKIE);
  const brokerSession = readSealedCookie(request, BROKER_COOKIE);
  const auto = readSealedCookie(request, AUTO_COOKIE);
  const broker = brokerSession ? brokerById(brokerSession.id) : null;

  return Response.json({
    authenticated: Boolean(user),
    user: user ? {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      provider: user.provider,
    } : null,
    broker: brokerSession && broker ? {
      id: broker.id,
      name: broker.name,
      paper: Boolean(brokerSession.paper),
      connected: true,
      accountStatus: brokerSession.accountStatus || '',
    } : null,
    auto: auto ? {
      active: Boolean(auto.active),
      preset: auto.preset || 'balanced',
      maxPositionPct: Number(auto.maxPositionPct || 5),
      maxDailyLossPct: Number(auto.maxDailyLossPct || 1),
      minConfidence: Number(auto.minConfidence || 90),
    } : { active: false, preset: null },
  });
}
