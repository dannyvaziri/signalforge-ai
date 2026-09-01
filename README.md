# SignalForge AI

SignalForge AI is a safe-by-default market intelligence and paper-trading dashboard. It can load Alpaca market news, generate structured AI research, apply deterministic risk controls, and submit **paper orders only**.

> Research and paper trading only. Not financial advice. Live trading is disabled. Simulated results do not guarantee future performance.

## Safety design

SignalForge deliberately separates AI research from execution:

```text
market news → AI research memo → proposed BUY / SELL / HOLD
                               ↓
                    deterministic risk engine
                               ↓
                   Alpaca PAPER endpoint only
```

AI cannot choose position size, change risk limits, disable the kill switch, short stocks, or choose a live broker endpoint.

The paper-order route is hard-coded to:

```text
https://paper-api.alpaca.markets
```

There is no live Alpaca trading URL in this project.

Default limits:

- Maximum order notional: $2,500
- Maximum projected single-stock exposure: 10% of equity
- Maximum daily drawdown: 2%
- Maximum open positions: 8
- Auto-paper minimum AI confidence: 85%
- Auto-paper minimum impact score: 8/10
- Stale signal threshold: 10 minutes
- Long-only; short selling blocked
- Leveraged/inverse ETFs blocked by the risk engine
- Duplicate intelligence/order attempts blocked in the running process
- Paper execution defaults OFF
- Auto paper execution defaults OFF

## Features

- Responsive finance dashboard
- Demo mode requiring no credentials
- Alpaca market-news REST feed
- OpenAI structured market research
- BUY / SELL / HOLD research output
- Deterministic server-side risk engine
- Alpaca paper-only order gateway
- Kill switch and execution locks
- Demo portfolio, decisions and journal views
- Health/configuration endpoint
- Automated GitHub tests and production build verification

## Run locally

Requires Node.js 20+.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

Without credentials the app automatically runs in demo mode.

## Environment variables

```bash
PAPER_EXECUTION_ENABLED=false
AUTO_EXECUTION_ENABLED=false
TRADING_KILL_SWITCH=false

ALPACA_API_KEY=
ALPACA_API_SECRET=

OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.4-mini
```

Never commit `.env` or `.env.local`.

### Recommended rollout

1. Leave `PAPER_EXECUTION_ENABLED=false` and review the dashboard/news/AI outputs.
2. Connect Alpaca **paper** API credentials.
3. Keep automatic execution off and test manual paper intents.
4. Review rejected signals and tune deterministic thresholds.
5. Only after paper validation, optionally set `AUTO_EXECUTION_ENABLED=true` for paper orders.

Live trading should remain a separate future project with additional controls, reconciliation, persistent audit infrastructure and independent review.

## API routes

- `GET /api/health` — mode and safety configuration without secrets.
- `GET /api/news` — latest Alpaca market news when paper/data credentials exist.
- `POST /api/analyze` — structured AI research for supplied ticker/news context; demo fallback when OpenAI is not configured.
- `POST /api/paper-order` — deterministic risk check followed by Alpaca paper order submission only when execution is explicitly enabled.

Example manual paper BUY intent:

```json
{
  "symbol": "NVDA",
  "side": "BUY",
  "notional": 500,
  "source": "manual",
  "confidence": 92,
  "impact": 8.9,
  "ageMinutes": 2,
  "intelligenceId": "news-123"
}
```

## Verify

```bash
npm test
npm run build
```

GitHub Actions runs both commands on pushes to `main`.

## Hostinger deployment

This is a Next.js Node application configured with standalone output. Use Node 20+ or 22, install dependencies with `npm install`, build with `npm run build`, and start with `npm start`.

Set secrets in the hosting environment, **not GitHub**. Start the hosted deployment with:

```text
PAPER_EXECUTION_ENABLED=false
AUTO_EXECUTION_ENABLED=false
TRADING_KILL_SWITCH=false
```

Then verify `/api/health` before adding paper credentials.
