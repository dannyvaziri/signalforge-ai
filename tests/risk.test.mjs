import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateRisk } from '../lib/risk.js';

const base = {
  symbol: 'NVDA', side: 'BUY', notional: 1000, qty: 0, source: 'manual', equity: 25000,
  currentPositionValue: 0, currentQty: 0, dailyLossPct: 0, openPositions: 2,
  confidence: 95, impact: 9, ageMinutes: 1, duplicate: false,
  killSwitch: false, executionAuthorized: true, autoExecution: false,
};

test('approves a compliant manual paper BUY', () => {
  assert.equal(evaluateRisk(base).approved, true);
});

test('kill switch blocks execution', () => {
  const result = evaluateRisk({ ...base, killSwitch: true });
  assert.equal(result.approved, false);
  assert.match(result.reasons.join(' '), /kill switch/i);
});

test('blocks short selling', () => {
  const result = evaluateRisk({ ...base, side: 'SELL', qty: 5, currentQty: 2, notional: 500 });
  assert.equal(result.approved, false);
  assert.match(result.reasons.join(' '), /short selling/i);
});

test('auto execution requires strong AI signal', () => {
  const result = evaluateRisk({ ...base, source: 'auto', autoExecution: true, confidence: 70, impact: 6 });
  assert.equal(result.approved, false);
  assert.match(result.reasons.join(' '), /confidence/i);
  assert.match(result.reasons.join(' '), /impact/i);
});
