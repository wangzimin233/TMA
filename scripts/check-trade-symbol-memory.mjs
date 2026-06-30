import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const appSource = readFileSync('src/App.tsx', 'utf8');
const bottomNavSource = readFileSync('src/components/BottomNav.tsx', 'utf8');
const tradeSource = readFileSync('src/pages/trade/TradePage.tsx', 'utf8');

assert.match(
  bottomNavSource,
  /import \{ symbolFormat \} from '\.\.\/lib\/utils';/,
  'BottomNav must import symbol formatting utilities for trade tab URLs',
);
assert.match(
  bottomNavSource,
  /const currentSymbol = useTradeStore\(\(state\) => state\.currentSymbol\);/,
  'BottomNav must read the remembered trade symbol from zustand',
);
assert.match(
  bottomNavSource,
  /const normalizedSymbol = symbolFormat\.normalize\(currentSymbol\);/,
  'BottomNav must normalize the remembered symbol before creating the trade URL',
);
assert.match(
  bottomNavSource,
  /tab\.key === 'trade' && tradePath \? tradePath : tab\.to/,
  'BottomNav must use the remembered trade URL only for the trade tab',
);

assert.match(
  appSource,
  /const setCurrentSymbol = useTradeStore\(\(state\) => state\.setCurrentSymbol\);/,
  'App must subscribe to the trade symbol setter',
);
assert.match(
  appSource,
  /const normalizedSymbol = symbolFormat\.normalize\(symbol\);/,
  'openTrade must normalize an explicit symbol before writing store and URL state',
);
assert.match(
  appSource,
  /setCurrentSymbol\(normalizedSymbol\);/,
  'openTrade must write explicit symbols into zustand',
);
assert.match(
  appSource,
  /useTradeStore\.getState\(\)\.currentSymbol/,
  'openTrade without a symbol must read the latest remembered symbol from zustand',
);

assert.match(
  tradeSource,
  /const rememberedSymbol = currentSymbol \? symbolFormat\.normalize\(currentSymbol\) : '';/,
  'TradePage must derive a normalized remembered symbol from zustand',
);
assert.match(
  tradeSource,
  /const shouldLoadDefaultSymbol = !routeSymbol && !rememberedSymbol;/,
  'TradePage must only load the first market row when URL and store are both empty',
);
assert.match(
  tradeSource,
  /if \(routeSymbol \|\| !rememberedSymbol\) return;/,
  'TradePage must skip remembered-symbol URL repair when a route symbol is present',
);
assert.match(
  tradeSource,
  /setSearchParams\(\{ symbol: symbolFormat\.toApi\(rememberedSymbol\) \}, \{ replace: true \}\);/,
  'TradePage must repair /trade to /trade?symbol=<remembered> when zustand has a symbol',
);
