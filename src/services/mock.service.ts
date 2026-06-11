import { depositNetworks, depositRecords, marketPairs, marketRows } from '../data/mock';

const wait = (ms = 180) => new Promise((resolve) => window.setTimeout(resolve, ms));

export async function getMockHomeMarkets() {
  await wait();
  return marketPairs;
}

export async function getMockMarketRows() {
  await wait();
  return marketRows;
}

export async function getMockAssets() {
  await wait();
  return {
    totalBalance: '45,231.89',
    fiatSymbol: '$',
    btcEstimate: '0.6432',
    changePercent: 2.4,
  };
}

export async function getMockDepositNetworks() {
  await wait();
  return depositNetworks;
}

export async function getMockDepositRecords() {
  await wait();
  return depositRecords;
}
