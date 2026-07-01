import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { accountQueryKeys } from './useAccountQueries';
import {
  applyWithdraw,
  confirmWithdrawGoogleAuthBind,
  fetchFundAssets,
  fetchSecurityInfo,
  fetchWithdrawCoins,
  fetchWithdrawOrders,
  initWithdrawGoogleAuthBind,
  type GoogleAuthBindConfirmPayload,
  type WithdrawApplyPayload,
} from '../api/withdraw';

export function useWithdrawCoins(enabled = true) {
  return useQuery({
    queryKey: ['withdraw', 'coins'],
    queryFn: fetchWithdrawCoins,
    enabled,
    staleTime: 60_000,
  });
}

export function useWithdrawOrders(coinCode?: string) {
  return useQuery({
    queryKey: ['withdraw', 'orders', coinCode],
    queryFn: () => fetchWithdrawOrders({ coinCode, page: 1, pageSize: 10 }),
    enabled: Boolean(coinCode),
  });
}

export function useAllWithdrawOrders() {
  return useQuery({
    queryKey: ['withdraw', 'orders', 'all'],
    queryFn: () => fetchWithdrawOrders({ page: 1, pageSize: 20 }),
  });
}

export function useFundAssets(enabled = true) {
  return useQuery({
    queryKey: ['account', 'assets', 'FUND'],
    queryFn: fetchFundAssets,
    enabled,
    staleTime: 30_000,
  });
}

export function useSecurityInfo(enabled = true) {
  return useQuery({
    queryKey: ['trade', 'security', 'info'],
    queryFn: fetchSecurityInfo,
    enabled,
    staleTime: 30_000,
  });
}

export function useWithdrawGoogleAuthBindInit(enabled = true) {
  return useQuery({
    queryKey: ['trade', 'security', 'google-auth', 'withdraw', 'bind', 'init'],
    queryFn: initWithdrawGoogleAuthBind,
    enabled,
    staleTime: 0,
    retry: false,
  });
}

export function useConfirmWithdrawGoogleAuthBind() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: GoogleAuthBindConfirmPayload) => confirmWithdrawGoogleAuthBind(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trade', 'security', 'info'] });
      queryClient.invalidateQueries({ queryKey: ['trade', 'security', 'google-auth', 'withdraw', 'bind', 'init'] });
    },
  });
}

export function useApplyWithdraw() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: WithdrawApplyPayload) => applyWithdraw(payload),
    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({ queryKey: ['withdraw', 'orders', payload.coinCode] });
      queryClient.invalidateQueries({ queryKey: ['withdraw', 'orders', 'all'] });
      queryClient.invalidateQueries({ queryKey: accountQueryKeys.root });
    },
  });
}
