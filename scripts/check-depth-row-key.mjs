import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const tradeSource = readFileSync('src/pages/trade/TradePage.tsx', 'utf8');
const depthRowsSource = tradeSource.match(/function DepthRows[\s\S]*?function DepthEmptyRows/)?.[0] ?? '';
const displayRowsSource = tradeSource.match(/function getCompactDepthDisplayRows[\s\S]*?function getSpotEstimatedValue/)?.[0] ?? '';

assert.notEqual(depthRowsSource, '', 'DepthRows source should be present');
assert.notEqual(displayRowsSource, '', 'Compact depth display row source should be present');
assert.match(
  tradeSource,
  /useFuturesDepth\(symbol,\s*20,\s*isContract\)/,
  'Contract order book should request 20 depth levels from the futures depth API',
);
assert.match(
  depthRowsSource,
  /rows\.map\(\(row,\s*rowIndex\) =>/,
  'DepthRows must include the row index when rendering depth rows because DOGE can have duplicate price levels',
);
assert.match(
  depthRowsSource,
  /key=\{`\$\{side\}-\$\{row\.price\}-\$\{rowIndex\}`\}/,
  'Depth row key must include side, price, and row index so duplicate prices do not accumulate stale DOM rows',
);
assert.match(
  displayRowsSource,
  /mode === 'contract'[\s\S]*orderType === 'market' \? 9 : 10/,
  'Contract limit order book should render 10 rows per side in both-side view',
);
assert.match(
  displayRowsSource,
  /mode === 'contract'[\s\S]*orderType === 'market' \? 9 : 10/,
  'Contract market order book should render 9 rows per side in both-side view',
);
assert.match(
  displayRowsSource,
  /takeProfitStopLossEnabled[\s\S]*\? 2/,
  'Contract take-profit/stop-loss mode should add 2 rows per side',
);
assert.match(
  displayRowsSource,
  /depthView === 'both'[\s\S]*Math\.min\(mode === 'contract' \? 12 : 10,\s*visibleRows\)/,
  'Contract both-side order book should allow 12 rows per side when TPSL is enabled',
);
