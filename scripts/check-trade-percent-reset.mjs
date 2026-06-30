import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const tradeSource = readFileSync('src/pages/trade/TradePage.tsx', 'utf8');

assert.match(
  tradeSource,
  /const percentResetKey = `\$\{symbol\}:\$\{side\}:\$\{orderType\}`;/,
  'SpotOrderForm must create a reset key from symbol, side, and order type',
);
assert.match(
  tradeSource,
  /<PercentRail compact resetKey=\{percentResetKey\} onPercentChange=\{applyBalancePercent\} \/>/,
  'Limit order percent rail must receive the form reset key',
);
assert.match(
  tradeSource,
  /function PercentRail\(\{ compact = false, resetKey, onPercentChange \}: \{ compact\?: boolean; resetKey\?: string; onPercentChange\?: \(percent: number\) => void \}\)/,
  'PercentRail must accept an optional resetKey prop',
);
assert.match(
  tradeSource,
  /useEffect\(\(\) => \{\s*setPercent\(0\);\s*setShowTooltip\(false\);[\s\S]*?\}, \[resetKey\]\);/,
  'PercentRail must reset its visual percent and tooltip when resetKey changes',
);
