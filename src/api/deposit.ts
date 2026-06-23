import { apiClient, requestData } from './client';

export type DepositNetwork = {
  networkCode: string;
  networkName: string;
  chainCode: string;
  protocolType: string;
  confirmCount: number;
  minDepositAmount: number;
  contractAddress?: string | null;
  memoSupport: number;
};

export type DepositCoin = {
  coinCode: string;
  coinName: string;
  iconUrl?: string | null;
  decimals: number;
  displayDecimals: number;
  networks: DepositNetwork[];
};

export type DepositAddress = {
  coinCode: string;
  coinName: string;
  networkCode: string;
  networkName: string;
  chainCode: string;
  protocolType: string;
  address: string;
  memoTag?: string | null;
  explorerUrl?: string | null;
  contractAddress?: string | null;
  confirmCount: number;
  minDepositAmount: number;
  memoSupport: number;
};

export type DepositOrder = {
  depositNo: string;
  coinCode: string;
  coinName: string;
  networkCode: string;
  networkName: string;
  depositAddress: string;
  fromAddress?: string | null;
  txid?: string | null;
  blockNo?: string | null;
  confirmCount: number;
  requiredConfirmCount: number;
  amount: number;
  orderStatus: number;
  creditedTime?: string | null;
  createTime?: string | null;
};

export type PageResult<T> = {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type DepositOrdersParams = {
  page?: number;
  pageSize?: number;
  coinCode?: string;
  orderStatus?: number;
};

export function fetchDepositCoins() {
  return requestData<DepositCoin[]>(apiClient.get('/api/trade/wallet/deposit/coins'));
}

export function fetchDepositAddress(params: { coinCode: string; networkCode: string }) {
  return requestData<DepositAddress>(apiClient.get('/api/trade/wallet/deposit/address', { params }));
}

export function fetchDepositOrders(params: DepositOrdersParams = {}) {
  return requestData<PageResult<DepositOrder>>(
    apiClient.get('/api/trade/wallet/deposit/orders', {
      params: {
        page: 1,
        pageSize: 10,
        ...params,
      },
    }),
  );
}
