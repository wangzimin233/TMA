import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';
import { spotApi } from '../api/spot';
import type { SpotKline, SpotMarketListParams, SpotKlineParams } from '../types/app';
import { symbolFormat } from '../lib/utils';
import { toast } from 'sonner';
import { getErrorMessage } from '../api/client';

/**
 * 查询现货交易对列表
 */
export function useSpotSymbols() {
  return useQuery({
    queryKey: ['spot', 'symbols'],
    queryFn: spotApi.getSymbols,
    staleTime: 5 * 60 * 1000, // 5分钟内不重新请求
  });
}

/**
 * 查询现货行情列表
 */
export function useSpotMarketList(params?: SpotMarketListParams, enabled = true) {
  return useQuery({
    queryKey: ['spot', 'marketList', params],
    queryFn: () => spotApi.getMarketList(params),
    refetchInterval: 5000, // 每5秒自动刷新
    enabled,
  });
}

/**
 * 查询现货24小时行情（批量）
 */
export function useSpotTickers(symbols?: string) {
  return useQuery({
    queryKey: ['spot', 'tickers', symbols],
    queryFn: () => spotApi.getTickers(symbols),
    refetchInterval: 3000, // 每3秒自动刷新
    enabled: !!symbols,
  });
}

/**
 * 查询现货币对详情摘要
 */
export function useSpotSummary(symbol: string) {
  const symbolCode = symbolFormat.toApi(symbol);

  return useQuery({
    queryKey: ['spot', 'summary', symbolCode],
    queryFn: () => spotApi.getSummary(symbolCode),
    refetchInterval: 3000, // 每3秒自动刷新
    enabled: !!symbol,
  });
}

/**
 * 查询现货K线
 */
export function useSpotKlines(params: SpotKlineParams) {
  const { symbol, ...rest } = params;
  const symbolCode = symbolFormat.toApi(symbol);

  return useQuery({
    queryKey: ['spot', 'klines', symbolCode, rest],
    queryFn: () => spotApi.getKlines({ symbol: symbolCode, ...rest }),
    staleTime: 10000, // 10秒内不重新请求
    enabled: !!symbol && !!params.interval,
  });
}

/**
 * 分页查询现货K线，向左滑动时按 endTime 加载更早历史
 */
export function useInfiniteSpotKlines(params: Pick<SpotKlineParams, 'symbol' | 'interval' | 'limit'>) {
  const { symbol, interval, limit = 500 } = params;
  const symbolCode = symbolFormat.toApi(symbol);

  return useInfiniteQuery<SpotKline[], Error, InfiniteData<SpotKline[], number | undefined>, (string | number)[], number | undefined>({
    queryKey: ['spot', 'klinesInfinite', symbolCode, interval, limit],
    queryFn: ({ pageParam }) => spotApi.getKlines({
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
    enabled: !!symbol && !!interval,
  });
}

/**
 * 查询现货盘口深度
 */
export function useSpotDepth(symbol: string, limit = 20) {
  const symbolCode = symbolFormat.toApi(symbol);

  return useQuery({
    queryKey: ['spot', 'depth', symbolCode, limit],
    queryFn: () => spotApi.getDepth(symbolCode, limit),
    refetchInterval: 2000, // 每2秒自动刷新
    enabled: !!symbol,
  });
}

/**
 * 查询现货最新成交
 */
export function useSpotTrades(symbol: string, limit = 50, enabled = true) {
  const symbolCode = symbolFormat.toApi(symbol);

  return useQuery({
    queryKey: ['spot', 'trades', symbolCode, limit],
    queryFn: () => spotApi.getTrades(symbolCode, limit),
    refetchInterval: 3000, // 每3秒自动刷新
    enabled: enabled && !!symbol,
  });
}

/**
 * 查询现货交易规则
 */
export function useSpotExchangeInfo(symbol: string) {
  const symbolCode = symbolFormat.toApi(symbol);

  return useQuery({
    queryKey: ['spot', 'exchangeInfo', symbolCode],
    queryFn: () => spotApi.getExchangeInfo(symbolCode),
    staleTime: 30 * 60 * 1000, // 30分钟内不重新请求
    enabled: !!symbol,
  });
}

// ============ 现货自选相关 ============

/**
 * 查询当前用户自选列表
 */
export function useSpotFavorites(enabled = true) {
  return useQuery({
    queryKey: ['spot', 'favorites'],
    queryFn: spotApi.getFavorites,
    refetchInterval: 5000, // 每5秒自动刷新
    enabled,
  });
}

/**
 * 查询收藏状态
 */
export function useSpotFavoriteStatus(symbol: string) {
  const symbolCode = symbolFormat.toApi(symbol);

  return useQuery({
    queryKey: ['spot', 'favoriteStatus', symbolCode],
    queryFn: () => spotApi.getFavoriteStatus(symbolCode),
    enabled: !!symbol,
    retry: false, // 未登录会返回401，不重试
  });
}

/**
 * 切换收藏状态（收藏/取消收藏）
 */
export function useToggleSpotFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ symbol, favorited }: { symbol: string; favorited: boolean }) => {
      const symbolCode = symbolFormat.toApi(symbol);
      if (favorited) {
        await spotApi.removeFavorite(symbolCode);
      } else {
        await spotApi.addFavorite(symbolCode);
      }
      return { symbol, favorited: !favorited };
    },
    onSuccess: (data) => {
      const symbolCode = symbolFormat.toApi(data.symbol);

      // 更新收藏状态缓存
      queryClient.setQueryData(['spot', 'favoriteStatus', symbolCode], {
        symbolCode,
        favorited: data.favorited,
      });

      // 刷新自选列表
      queryClient.invalidateQueries({ queryKey: ['spot', 'favorites'] });

      toast.success(data.favorited ? '已加入自选' : '已取消自选');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
