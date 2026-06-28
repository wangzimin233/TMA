import { useQuery } from '@tanstack/react-query';
import {
  getMockAssets,
  getMockDepositNetworks,
  getMockDepositRecords,
} from '../services/mock.service';

export function useUserAssets() {
  return useQuery({
    queryKey: ['mock', 'assets'],
    queryFn: getMockAssets,
  });
}

export function useDepositNetworks() {
  return useQuery({
    queryKey: ['mock', 'depositNetworks'],
    queryFn: getMockDepositNetworks,
  });
}

export function useDepositRecords() {
  return useQuery({
    queryKey: ['mock', 'depositRecords'],
    queryFn: getMockDepositRecords,
  });
}
