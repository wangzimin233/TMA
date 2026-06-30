import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const source = readFileSync('src/api/futures.ts', 'utf8');

assert.equal(source.includes('apiClient.get'), false, 'futures market API must not use GET requests');

const requiredSnippets = [
  "apiClient.post<ApiResult<FuturesSymbol[]>>('/api/trade/futures/market/symbols')",
  "apiClient.post<ApiResult<FuturesMarketItem[]>>('/api/trade/futures/market/market-list', params ?? {})",
  "apiClient.post<ApiResult<FuturesSummary>>('/api/trade/futures/market/summary', { symbol })",
  "apiClient.post<ApiResult<FuturesMarkPrice>>('/api/trade/futures/market/mark-price', { symbol })",
  "apiClient.post<ApiResult<FuturesKline[]>>('/api/trade/futures/market/klines', params)",
  "apiClient.post<ApiResult<FuturesDepth>>('/api/trade/futures/market/depth', { symbol, limit })",
  "apiClient.post<ApiResult<FuturesTrade[]>>('/api/trade/futures/market/trades', { symbol, limit })",
  "apiClient.post<ApiResult<FuturesTradeConfig>>('/api/trade/futures/market/trade-config', { symbol })",
];

for (const snippet of requiredSnippets) {
  assert.equal(source.includes(snippet), true, `Missing POST body shape: ${snippet}`);
}
