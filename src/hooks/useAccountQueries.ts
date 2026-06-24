import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchAccountAssets,
  fetchAccountOverview,
  fetchAccountSummary,
  transferAccount,
  type AccountTransferPayload,
  type AccountType,
} from '../api/account';

export const accountQueryKeys = {
  root: ['account'] as const,
  overview: ['account', 'overview'] as const,
  summary: ['account', 'summary'] as const,
  assets: (accountType?: AccountType) => ['account', 'assets', accountType ?? 'ALL'] as const,
};

export function useAccountOverview(enabled = true) {
  return useQuery({
    queryKey: accountQueryKeys.overview,
    queryFn: fetchAccountOverview,
    enabled,
    staleTime: 30_000,
  });
}

export function useAccountAssets(accountType?: AccountType, enabled = true) {
  return useQuery({
    queryKey: accountQueryKeys.assets(accountType),
    queryFn: () => fetchAccountAssets(accountType),
    enabled,
    staleTime: 30_000,
  });
}

export function useAccountSummary(enabled = true) {
  return useQuery({
    queryKey: accountQueryKeys.summary,
    queryFn: fetchAccountSummary,
    enabled,
    staleTime: 30_000,
  });
}

export function useTransferAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AccountTransferPayload) => transferAccount(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountQueryKeys.root });
      queryClient.invalidateQueries({ queryKey: ['withdraw'] });
      queryClient.invalidateQueries({ queryKey: ['deposit'] });
    },
  });
}
