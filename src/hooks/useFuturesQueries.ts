import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';
import { futuresApi } from '../api/futures';
import type { FuturesKline, FuturesKlineParams, FuturesMarketListParams } from '../types/app';
import { symbolFormat } from '../lib/utils';

export function useFuturesSymbols() {
  return useQuery({
    queryKey: ['futures', 'symbols'],
    queryFn: futuresApi.getSymbols,
    staleTime: 5 * 60 * 1000,
  });
}

export function useFuturesMarketList(params?: FuturesMarketListParams, enabled = true) {
  return useQuery({
    queryKey: ['futures', 'marketList', params],
    queryFn: () => futuresApi.getMarketList(params),
    refetchInterval: 5000,
    enabled,
  });
}

export function useFuturesSummary(symbol: string, enabled = true) {
  const symbolCode = symbolFormat.toApi(symbol);

  return useQuery({
    queryKey: ['futures', 'summary', symbolCode],
    queryFn: () => futuresApi.getSummary(symbolCode),
    refetchInterval: 3000,
    enabled: enabled && !!symbol,
  });
}

export function useFuturesMarkPrice(symbol: string, enabled = true) {
  const symbolCode = symbolFormat.toApi(symbol);

  return useQuery({
    queryKey: ['futures', 'markPrice', symbolCode],
    queryFn: () => futuresApi.getMarkPrice(symbolCode),
    refetchInterval: 3000,
    enabled: enabled && !!symbol,
  });
}

export function useFuturesKlines(params: FuturesKlineParams, enabled = true) {
  const { symbol, ...rest } = params;
  const symbolCode = symbolFormat.toApi(symbol);

  return useQuery({
    queryKey: ['futures', 'klines', symbolCode, rest],
    queryFn: () => futuresApi.getKlines({ symbol: symbolCode, ...rest }),
    staleTime: 10000,
    enabled: enabled && !!symbol && !!params.interval,
  });
}

export function useInfiniteFuturesKlines(params: Pick<FuturesKlineParams, 'symbol' | 'interval' | 'limit'>, enabled = true) {
  const { symbol, interval, limit = 500 } = params;
  const symbolCode = symbolFormat.toApi(symbol);

  return useInfiniteQuery<FuturesKline[], Error, InfiniteData<FuturesKline[], number | undefined>, (string | number | boolean)[], number | undefined>({
    queryKey: ['futures', 'klinesInfinite', symbolCode, interval, limit, enabled],
    queryFn: ({ pageParam }) => futuresApi.getKlines({
      symbol: symbolCode,
      interval,
      limit,
      ...(typeof pageParam === 'number' ? { endTime: pageParam } : {}),
    }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.length || lastPage.length < limit) return undefined;

      const earliestOpenTime = allPages
        .flat()
        .reduce<number | undefined>((earliest, item) => (
          earliest === undefined || item.openTime < earliest ? item.openTime : earliest
        ), undefined);

      return earliestOpenTime === undefined ? undefined : earliestOpenTime - 1;
    },
    staleTime: 10000,
    enabled: enabled && !!symbol && !!interval,
  });
}

export function useFuturesDepth(symbol: string, limit = 20, enabled = true) {
  const symbolCode = symbolFormat.toApi(symbol);

  return useQuery({
    queryKey: ['futures', 'depth', symbolCode, limit],
    queryFn: () => futuresApi.getDepth(symbolCode, limit),
    refetchInterval: 2000,
    enabled: enabled && !!symbol,
  });
}

export function useFuturesTrades(symbol: string, limit = 50, enabled = true) {
  const symbolCode = symbolFormat.toApi(symbol);

  return useQuery({
    queryKey: ['futures', 'trades', symbolCode, limit],
    queryFn: () => futuresApi.getTrades(symbolCode, limit),
    refetchInterval: 3000,
    enabled: enabled && !!symbol,
  });
}

export function useFuturesTradeConfig(symbol: string, enabled = true) {
  const symbolCode = symbolFormat.toApi(symbol);

  return useQuery({
    queryKey: ['futures', 'tradeConfig', symbolCode],
    queryFn: () => futuresApi.getTradeConfig(symbolCode),
    staleTime: 5 * 60 * 1000,
    enabled: enabled && !!symbol,
  });
}
