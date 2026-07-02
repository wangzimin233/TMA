import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { InfiniteData, UseQueryOptions } from '@tanstack/react-query';
import { futuresApi } from '../api/futures';
import type { FuturesCancelOrderPayload, FuturesOrderHistoryParams } from '../api/futures';
import type { FuturesKline, FuturesKlineParams, FuturesMarketListParams } from '../types/app';
import { symbolFormat } from '../lib/utils';
import { accountQueryKeys } from './useAccountQueries';
import type { FuturesPlaceOrderPayload } from '../lib/futures-order';
import { toast } from 'sonner';
import { getErrorMessage } from '../api/client';

export const futuresOrderQueryKeys = {
  root: ['futures', 'orders'] as const,
  open: (symbolCode?: string) => ['futures', 'orders', 'open', symbolCode ?? 'ALL'] as const,
  history: (params?: FuturesOrderHistoryParams) => ['futures', 'orders', 'history', params ?? {}] as const,
  detail: (orderNo?: string) => ['futures', 'orders', 'detail', orderNo ?? ''] as const,
};

export const futuresPositionQueryKeys = {
  root: ['futures', 'positions'] as const,
  list: (symbolCode?: string) => ['futures', 'positions', symbolCode ?? 'ALL'] as const,
};

export type FuturesPositionsQueryOptions = Pick<
  UseQueryOptions<Awaited<ReturnType<typeof futuresApi.getPositions>>, Error>,
  'refetchInterval' | 'refetchIntervalInBackground' | 'staleTime'
>;

export type FuturesOpenOrdersQueryOptions = Pick<
  UseQueryOptions<Awaited<ReturnType<typeof futuresApi.getOpenOrders>>, Error>,
  'refetchInterval' | 'refetchIntervalInBackground' | 'staleTime'
>;

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

export function useFuturesPositions(symbol: string, enabled = true, options?: FuturesPositionsQueryOptions) {
  const symbolCode = symbolFormat.toApi(symbol);

  return useQuery({
    queryKey: futuresPositionQueryKeys.list(symbolCode),
    queryFn: () => futuresApi.getPositions(symbolCode),
    enabled: enabled && !!symbol,
    staleTime: 10_000,
    ...options,
  });
}

export function useFuturesOpenOrders(symbol: string, enabled = true, options?: FuturesOpenOrdersQueryOptions) {
  const symbolCode = symbolFormat.toApi(symbol);

  return useQuery({
    queryKey: futuresOrderQueryKeys.open(symbolCode),
    queryFn: () => futuresApi.getOpenOrders(symbolCode),
    enabled: enabled && !!symbol,
    staleTime: 10_000,
    ...options,
  });
}

export function useFuturesOrderHistory(symbol: string, enabled = true) {
  const symbolCode = symbolFormat.toApi(symbol);
  const params: FuturesOrderHistoryParams = { page: 1, pageSize: 10, symbolCode };

  return useQuery({
    queryKey: futuresOrderQueryKeys.history(params),
    queryFn: () => futuresApi.getOrderHistory(params),
    enabled: enabled && !!symbol,
    staleTime: 10_000,
  });
}

export function useFuturesOrderDetail(orderNo: string | null, enabled = true) {
  return useQuery({
    queryKey: futuresOrderQueryKeys.detail(orderNo ?? undefined),
    queryFn: () => futuresApi.getOrderDetail(orderNo ?? ''),
    enabled: enabled && !!orderNo,
    staleTime: 30_000,
  });
}

export function usePlaceFuturesOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: FuturesPlaceOrderPayload) => futuresApi.placeFuturesOrder(payload),
    onSuccess: (_data, payload) => {
      queryClient.invalidateQueries({ queryKey: accountQueryKeys.root });
      queryClient.invalidateQueries({ queryKey: futuresOrderQueryKeys.root });
      queryClient.invalidateQueries({ queryKey: futuresPositionQueryKeys.root });
      queryClient.refetchQueries({ queryKey: futuresPositionQueryKeys.list(payload.symbolCode) });
      queryClient.refetchQueries({ queryKey: futuresOrderQueryKeys.open(payload.symbolCode) });
      toast.success('合约下单成功');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useCancelFuturesOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: FuturesCancelOrderPayload) => futuresApi.cancelFuturesOrder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountQueryKeys.root });
      queryClient.invalidateQueries({ queryKey: futuresOrderQueryKeys.root });
      queryClient.invalidateQueries({ queryKey: futuresPositionQueryKeys.root });
      toast.success('撤单成功');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
