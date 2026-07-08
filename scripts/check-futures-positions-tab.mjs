import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const source = readFileSync('src/pages/trade/TradePage.tsx', 'utf8');

assert.match(
  source,
  /type OrdersTab = 'positions' \| 'open' \| 'history'/,
  'CurrentOrders should include a positions tab before open and history',
);

assert.match(
  source,
  /useFuturesPositions\([^)]*queryEnabled && isContract && activeTab === 'positions'[^)]*\{\s*refetchInterval: 3000,\s*staleTime: 3000,\s*\}\s*\)/s,
  'Futures positions tab should query positions only while the contract positions tab is active',
);

assert.match(
  source,
  /activeTab === 'positions'[\s\S]*?持有仓位[\s\S]*?activeTab === 'open'[\s\S]*?当前委托[\s\S]*?activeTab === 'history'[\s\S]*?历史委托/,
  'Contract tabs should render 持有仓位 before 当前委托 and 历史委托',
);

assert.match(
  source,
  /function FuturesPositionRow\(\{ position \}: \{ position: FuturesPosition \}\)/,
  'Futures positions should render through a dedicated row component',
);

for (const label of ['持仓', '可平', '开仓均价', '标记价', '保证金', '未实现盈亏', '强平价']) {
  assert.equal(
    source.includes(`label="${label}"`),
    true,
    `Futures position row should display ${label}`,
  );
}
