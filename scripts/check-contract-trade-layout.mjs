import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const source = readFileSync('src/pages/trade/TradePage.tsx', 'utf8');

assert.equal(
  source.includes('function ChartTradePage'),
  false,
  'Contract mode should use the shared spot-style trade skeleton, not a separate chart page',
);

assert.match(
  source,
  /<TradingWorkspace[\s\S]*mode=\{mode\}[\s\S]*openLeverage=\{openLeverage\}/,
  'Trade page should render the shared workspace with mode and leverage props',
);

assert.match(
  source,
  /function CompactOrderBook\([^)]*mode[^)]*\)/,
  'Compact order book should accept trade mode so contract mode can use futures depth',
);

assert.match(
  source,
  /function ContractOrderForm/,
  'Contract mode should have a compact contract order form for the shared workspace',
);

assert.match(
  source,
  /<CurrentOrders[\s\S]*mode=\{mode\}/,
  'Current orders should receive trade mode for contract-specific empty state',
);

assert.match(
  source,
  /暂无合约委托/,
  'Contract order empty state should not use spot wording',
);

const contractOrderFormSource = source.match(/function ContractOrderForm[\s\S]*?function TradeInput/)?.[0] ?? '';
assert.notEqual(contractOrderFormSource, '', 'Contract order form source should be present');

for (const label of ['逐仓', '双向', '开多', '开空', '平多', '平空']) {
  assert.equal(
    contractOrderFormSource.includes(label),
    true,
    `Contract order form should expose fixed isolated hedge-mode action label: ${label}`,
  );
}

assert.equal(
  contractOrderFormSource.includes('全仓'),
  false,
  'Contract order form must not imply cross margin is available',
);

assert.match(
  contractOrderFormSource,
  /disabled[\s\S]*>\s*\{primaryAction\.label\}/,
  'Primary contract action button should remain disabled',
);
assert.match(
  contractOrderFormSource,
  /disabled[\s\S]*>\s*\{secondaryAction\.label\}/,
  'Secondary contract action button should remain disabled',
);

assert.equal(
  contractOrderFormSource.includes('最优价'),
  false,
  'Contract order form should remove the best-price shortcut button',
);

assert.match(
  contractOrderFormSource,
  /<DropdownMenu>[\s\S]*<DropdownMenuTrigger asChild>[\s\S]*\{getOrderTypeLabel\(orderType\)\}/,
  'Contract order type switch should use the same dropdown trigger style as spot',
);

assert.equal(
  contractOrderFormSource.includes('value={orderType} onValueChange'),
  false,
  'Contract order type switch should not use the old two-tab control',
);

assert.match(
  contractOrderFormSource,
  /positionMode === 'open' && \([\s\S]*label="止盈\/止损"/,
  'Take-profit/stop-loss controls should only render in open-position mode',
);
