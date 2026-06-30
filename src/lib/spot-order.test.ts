import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildSpotOrderPayload,
  getSpotOrderValidation,
  type SpotOrderBalance,
  type SpotOrderRule,
} from './spot-order';

const rule: SpotOrderRule = {
  spotTradingAllowed: true,
  spotTradable: true,
  orderTypes: ['LIMIT', 'MARKET'],
  minPrice: '1',
  maxPrice: '100000',
  tickSize: '0.01',
  minQty: '0.001',
  maxQty: '100',
  stepSize: '0.001',
  minNotional: '10',
};

const balances: Record<string, SpotOrderBalance> = {
  BTC: { coinCode: 'BTC', availableBalance: '2' },
  USDT: { coinCode: 'USDT', availableBalance: '1000' },
};

test('builds limit order payload with GTC and decimal string inputs', () => {
  assert.deepEqual(buildSpotOrderPayload({
    symbolCode: 'BTCUSDT',
    side: 'buy',
    orderType: 'limit',
    price: '65000.12',
    quantity: '0.01',
    amount: '650.0012',
  }), {
    symbolCode: 'BTCUSDT',
    side: 'BUY',
    orderType: 'LIMIT',
    timeInForce: 'GTC',
    price: 65000.12,
    quantity: 0.01,
  });
});

test('builds market order payloads for quote buy and base sell', () => {
  assert.deepEqual(buildSpotOrderPayload({
    symbolCode: 'BTCUSDT',
    side: 'buy',
    orderType: 'market',
    price: '',
    quantity: '',
    amount: '25',
  }), {
    symbolCode: 'BTCUSDT',
    side: 'BUY',
    orderType: 'MARKET',
    quoteAmount: 25,
  });

  assert.deepEqual(buildSpotOrderPayload({
    symbolCode: 'BTCUSDT',
    side: 'sell',
    orderType: 'market',
    price: '',
    quantity: '0.25',
    amount: '',
  }), {
    symbolCode: 'BTCUSDT',
    side: 'SELL',
    orderType: 'MARKET',
    quantity: 0.25,
  });
});

test('validates spot trading state, balance, step, and notional', () => {
  assert.equal(getSpotOrderValidation({
    rule,
    balances,
    base: 'BTC',
    quote: 'USDT',
    side: 'buy',
    orderType: 'limit',
    price: '65000.123',
    quantity: '0.01',
    amount: '650.00123',
    marketPrice: '65000',
  }).reason, '价格需符合步长 0.01');

  assert.equal(getSpotOrderValidation({
    rule,
    balances,
    base: 'BTC',
    quote: 'USDT',
    side: 'sell',
    orderType: 'limit',
    price: '65000.12',
    quantity: '2.001',
    amount: '130065.24012',
    marketPrice: '65000',
  }).reason, 'BTC 可用余额不足');

  assert.equal(getSpotOrderValidation({
    rule,
    balances,
    base: 'BTC',
    quote: 'USDT',
    side: 'buy',
    orderType: 'limit',
    price: '100',
    quantity: '0.01',
    amount: '1',
    marketPrice: '100',
  }).reason, '实际下单金额不能低于 10 USDT');

  assert.equal(getSpotOrderValidation({
    rule,
    balances,
    base: 'BTC',
    quote: 'USDT',
    side: 'buy',
    orderType: 'market',
    price: '',
    quantity: '',
    amount: '9',
    marketPrice: '100',
  }).reason, '成交金额不能低于 10 USDT');

  assert.equal(getSpotOrderValidation({
    rule,
    balances,
    base: 'BTC',
    quote: 'USDT',
    side: 'buy',
    orderType: 'limit',
    price: '100',
    quantity: '0.1',
    amount: '10',
    marketPrice: '100',
  }).canSubmit, true);
});
