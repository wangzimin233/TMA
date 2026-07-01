import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const futuresOrderSource = readFileSync('src/lib/futures-order.ts', 'utf8');
const tradePageSource = readFileSync('src/pages/trade/TradePage.tsx', 'utf8');

assert.match(
  futuresOrderSource,
  /export type FuturesTimeInForce = 'GTC' \| 'IOC' \| 'FOK';/,
  'Futures limit order time-in-force type should only include GTC, IOC, and FOK',
);

const timeInForceOptionsSource = tradePageSource.match(/const contractTimeInForceOptions[\s\S]*?\];/)?.[0] ?? '';
assert.notEqual(timeInForceOptionsSource, '', 'Contract time-in-force options should be present');

for (const value of ['GTC', 'IOC', 'FOK']) {
  assert.equal(
    timeInForceOptionsSource.includes(`value: '${value}'`),
    true,
    `Contract time-in-force drawer should include ${value}`,
  );
}

assert.equal(
  timeInForceOptionsSource.includes('GTD'),
  false,
  'Contract time-in-force drawer should not expose GTD because the API does not support it',
);

assert.match(
  futuresOrderSource,
  /if \(input\.orderType === 'limit'\) \{[\s\S]*payload\.timeInForce = input\.timeInForce \?\? 'GTC';[\s\S]*payload\.price = decimalStringToApiNumber\(input\.price\);[\s\S]*\}/,
  'Only limit futures orders should attach timeInForce and price',
);
