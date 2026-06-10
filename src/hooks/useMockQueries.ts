import { useQuery } from '@tanstack/react-query';
import { getMockAssets, getMockHomeMarkets, getMockMarketRows } from '../services/mock.service';

export function useHomeMarkets() {
  return useQuery({
    queryKey: ['mock', 'homeMarkets'],
    queryFn: getMockHomeMarkets,
  });
}

export function useMarketRows() {
  return useQuery({
    queryKey: ['mock', 'marketRows'],
    queryFn: getMockMarketRows,
  });
}

export function useUserAssets() {
  return useQuery({
    queryKey: ['mock', 'assets'],
    queryFn: getMockAssets,
  });
}
