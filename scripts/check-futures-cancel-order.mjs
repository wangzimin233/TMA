import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const futuresApiSource = readFileSync('src/api/futures.ts', 'utf8');
const futuresHooksSource = readFileSync('src/hooks/useFuturesQueries.ts', 'utf8');
const tradePageSource = readFileSync('src/pages/trade/TradePage.tsx', 'utf8');

assert.match(
  futuresApiSource,
  /export type FuturesCancelOrderPayload = \{\s*orderNo: string;\s*remark\?: string;\s*\};/s,
  'Futures API should define the cancel order payload from Swagger',
);

assert.match(
  futuresApiSource,
  /cancelFuturesOrder: \(payload: FuturesCancelOrderPayload\) => \{[\s\S]*apiClient\.post<ApiResult<FuturesOrder>>\('\/api\/trade\/futures\/order\/cancel', payload\)/,
  'Futures API should call POST /api/trade/futures/order/cancel',
);

assert.match(
  futuresHooksSource,
  /export function useCancelFuturesOrder\(\)/,
  'Futures hooks should expose a cancel mutation',
);

assert.match(
  futuresHooksSource,
  /mutationFn: \(payload: FuturesCancelOrderPayload\) => futuresApi\.cancelFuturesOrder\(payload\)/,
  'Futures cancel mutation should call futuresApi.cancelFuturesOrder',
);

assert.match(
  futuresHooksSource,
  /queryClient\.invalidateQueries\(\{ queryKey: futuresOrderQueryKeys\.root \}\);[\s\S]*queryClient\.invalidateQueries\(\{ queryKey: futuresPositionQueryKeys\.root \}\);/,
  'Futures cancel success should refresh futures orders and positions',
);

assert.match(
  tradePageSource,
  /useCancelFuturesOrder/,
  'Trade page should import and use the futures cancel mutation',
);

assert.match(
  tradePageSource,
  /const cancelOrder = isContract \? futuresCancelOrder : spotCancelOrder;/,
  'CurrentOrders should choose futures cancel mutation in contract mode',
);

assert.match(
  tradePageSource,
  /showCancel=\{activeTab === 'open'\}/,
  'Current orders should show cancel actions for spot and futures open orders',
);
