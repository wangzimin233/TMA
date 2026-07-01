import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const orderSource = readFileSync('src/lib/futures-order.ts', 'utf8');
const tradeSource = readFileSync('src/pages/trade/TradePage.tsx', 'utf8');
const contractOrderFormSource = tradeSource.match(/function ContractOrderForm[\s\S]*?function ContractTimeInForceDrawer/)?.[0] ?? '';

assert.notEqual(contractOrderFormSource, '', 'ContractOrderForm source should be present');

assert.match(
  orderSource,
  /export type FuturesQuantityUnit = 'base' \| 'quote';/,
  'Futures order helper should expose a base/quote quantity unit type',
);

assert.match(
  orderSource,
  /export function getFuturesBaseQuantityFromUnit\(/,
  'Futures order helper should convert the displayed unit into base quantity for validation and payload',
);

assert.match(
  orderSource,
  /export function convertFuturesQuantityUnit\(/,
  'Futures order helper should convert existing input values when switching units',
);

assert.match(
  orderSource,
  /floorDecimalToStep\(.*stepSize/,
  'Quote-to-base futures quantity conversion should floor to the exchange step size',
);

assert.match(
  contractOrderFormSource,
  /const \[quantityUnit,\s*setQuantityUnit\] = useState<FuturesQuantityUnit>\('base'\)/,
  'Contract order form should track whether the quantity input is in base or quote units',
);

assert.match(
  contractOrderFormSource,
  /const orderQuantity = getFuturesBaseQuantityFromUnit\(/,
  'Contract order form should derive the base quantity before validation and submission',
);

assert.match(
  contractOrderFormSource,
  /quantity:\s*orderQuantity,/,
  'Contract order payload should submit the derived base quantity, not the raw displayed input',
);

assert.match(
  contractOrderFormSource,
  /<ContractQuantityUnitMenu[\s\S]*selected=\{quantityUnit\}[\s\S]*onSelect=\{changeQuantityUnit\}/,
  'Contract quantity input suffix should open a base/quote unit menu',
);

assert.match(
  contractOrderFormSource,
  /resetKey=\{`\$\{symbol\}:\$\{positionMode\}:\$\{orderType\}:\$\{quantityUnit\}`\}/,
  'Contract percent rail should reset when the quantity unit changes',
);
