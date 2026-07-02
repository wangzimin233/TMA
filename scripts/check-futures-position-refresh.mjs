import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const hooksSource = readFileSync('src/hooks/useFuturesQueries.ts', 'utf8');
const tradePageSource = readFileSync('src/pages/trade/TradePage.tsx', 'utf8');

assert.match(
  hooksSource,
  /import type \{[^}]*UseQueryOptions[^}]*\} from '@tanstack\/react-query'/s,
  'Futures query hooks should accept typed React Query options for page-specific polling',
);

assert.match(
  hooksSource,
  /useFuturesPositions\(symbol: string, enabled = true, options\?: FuturesPositionsQueryOptions\)/,
  'useFuturesPositions should expose an optional options argument',
);

assert.match(
  hooksSource,
  /useFuturesOpenOrders\(symbol: string, enabled = true, options\?: FuturesOpenOrdersQueryOptions\)/,
  'useFuturesOpenOrders should expose an optional options argument',
);

assert.match(
  tradePageSource,
  /useFuturesPositions\(symbol, isAuthenticated, \{\s*refetchInterval: 3000,\s*staleTime: 3000,\s*\}\)/s,
  'Contract order form should poll futures positions every 3 seconds while active',
);

assert.match(
  tradePageSource,
  /useFuturesOpenOrders\([^)]*queryEnabled && isContract && activeTab === 'open'[^)]*\{\s*refetchInterval: 3000,\s*staleTime: 3000,\s*\}\s*\)/s,
  'Contract open orders should poll every 3 seconds only on the active current-orders tab',
);

assert.match(
  hooksSource,
  /onSuccess: \(_data, payload\) => \{[\s\S]*queryClient\.refetchQueries\(\{ queryKey: futuresPositionQueryKeys\.list\(payload\.symbolCode\) \}\)/,
  'Successful futures orders should immediately refetch positions for the submitted symbol',
);

assert.match(
  hooksSource,
  /onSuccess: \(_data, payload\) => \{[\s\S]*queryClient\.refetchQueries\(\{ queryKey: futuresOrderQueryKeys\.open\(payload\.symbolCode\) \}\)/,
  'Successful futures orders should immediately refetch open orders for the submitted symbol',
);
