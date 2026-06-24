import { useQuery } from '@tanstack/react-query';
import { fetchDepositAddress, fetchDepositCoins, fetchDepositOrders } from '../api/deposit';

export function useDepositCoins(enabled = true) {
  return useQuery({
    queryKey: ['deposit', 'coins'],
    queryFn: fetchDepositCoins,
    enabled,
    staleTime: 60_000,
  });
}

export function useDepositAddress(coinCode?: string, networkCode?: string) {
  return useQuery({
    queryKey: ['deposit', 'address', coinCode, networkCode],
    queryFn: () => fetchDepositAddress({ coinCode: coinCode!, networkCode: networkCode! }),
    enabled: Boolean(coinCode && networkCode),
  });
}

export function useDepositOrders(coinCode?: string) {
  return useQuery({
    queryKey: ['deposit', 'orders', coinCode],
    queryFn: () => fetchDepositOrders({ coinCode, page: 1, pageSize: 10 }),
    enabled: Boolean(coinCode),
  });
}

export function useAllDepositOrders() {
  return useQuery({
    queryKey: ['deposit', 'orders', 'all'],
    queryFn: () => fetchDepositOrders({ page: 1, pageSize: 20 }),
  });
}
