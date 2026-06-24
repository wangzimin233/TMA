import { apiClient, requestData } from './client';

export type AccountType = 'FUND' | 'SPOT' | 'FUTURES';

export type AccountOverview = {
  valuationCoinCode: string;
  estimatedTotalValue: number;
  estimatedAvailableValue: number;
  estimatedFrozenValue: number;
  estimatedPendingDepositValue: number;
  estimatedPendingWithdrawValue: number;
  estimatedUnrealizedPnlValue: number;
  todayPnlValue: number;
  hasOtherCoinAssets: boolean;
  valuationRemark?: string | null;
};

export type AccountAsset = {
  accountId: number;
  accountType: AccountType | string;
  accountName: string;
  coinCode: string;
  coinName: string;
  totalBalance: number;
  availableBalance: number;
  frozenBalance: number;
  marginBalance: number;
  unrealizedPnlBalance: number;
  pendingDeposit: number;
  pendingWithdraw: number;
  accountStatus: number;
};

export type AccountSummary = {
  accountType: AccountType | string;
  accountName: string;
  estimatedValue: number;
  availableValue: number;
  frozenValue: number;
  marginValue: number;
  unrealizedPnlValue: number;
  pendingDepositValue: number;
  pendingWithdrawValue: number;
  assetCount: number;
  hasOtherCoinAssets: boolean;
};

export type AccountTransferPayload = {
  fromAccountType: AccountType;
  toAccountType: AccountType;
  coinCode: string;
  amount: number;
  remark?: string;
};

export type AccountTransferResponse = {
  bizNo: string;
  fromAccountType: AccountType | string;
  toAccountType: AccountType | string;
  coinCode: string;
  amount: number;
  fromAvailableBalance: number;
  toAvailableBalance: number;
};

export function fetchAccountOverview() {
  return requestData<AccountOverview>(apiClient.get('/api/trade/account/overview'));
}

export function fetchAccountAssets(accountType?: AccountType) {
  return requestData<AccountAsset[]>(
    apiClient.get('/api/trade/account/assets', {
      params: accountType ? { accountType } : undefined,
    }),
  );
}

export function fetchAccountSummary() {
  return requestData<AccountSummary[]>(apiClient.get('/api/trade/account/account-summary'));
}

export function transferAccount(payload: AccountTransferPayload) {
  return requestData<AccountTransferResponse>(apiClient.post('/api/trade/account/transfer', payload));
}
