import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildFuturesOrderPayload,
  getFuturesOrderValidation,
  type FuturesOrderBalance,
  type FuturesOrderPosition,
  type FuturesOrderRule,
} from './futures-order';

const rule: FuturesOrderRule = {
  futuresTradable: true,
  minPrice: '1',
  maxPrice: '100000',
  tickSize: '0.01',
  minQty: '0.001',
  maxQty: '100',
  stepSize: '0.001',
  minNotional: '10',
};

const balance: FuturesOrderBalance = {
  coinCode: 'USDT',
  availableBalance: '1000',
};

const positions: FuturesOrderPosition[] = [
  { positionSide: 'LONG', availableQty: '0.5' },
  { positionSide: 'SHORT', availableQty: '0.25' },
];

test('builds futures order payloads for open and close actions', () => {
  assert.deepEqual(buildFuturesOrderPayload({
    symbolCode: 'BTCUSDT',
    positionMode: 'open',
    direction: 'long',
    orderType: 'limit',
    price: '65000.12',
    quantity: '0.01',
    leverage: 20,
  }), {
    symbolCode: 'BTCUSDT',
    tradeAction: 'OPEN_LONG',
    orderType: 'LIMIT',
    timeInForce: 'GTC',
    price: 65000.12,
    quantity: 0.01,
    leverage: 20,
    remark: '用户主动开多',
  });

  assert.deepEqual(buildFuturesOrderPayload({
    symbolCode: 'BTCUSDT',
    positionMode: 'close',
    direction: 'short',
    orderType: 'market',
    price: '',
    quantity: '0.02',
    leverage: 10,
  }), {
    symbolCode: 'BTCUSDT',
    tradeAction: 'CLOSE_SHORT',
    orderType: 'MARKET',
    quantity: 0.02,
    leverage: 10,
    remark: '用户主动平空',
  });
});

test('builds limit futures order payload with selected time in force', () => {
  assert.equal(buildFuturesOrderPayload({
    symbolCode: 'BTCUSDT',
    positionMode: 'open',
    direction: 'short',
    orderType: 'limit',
    price: '65000.12',
    quantity: '0.01',
    timeInForce: 'IOC',
  }).timeInForce, 'IOC');
});

test('validates futures rule, balance, step, notional, and close quantity', () => {
  assert.equal(getFuturesOrderValidation({
    rule,
    balance,
    positions,
    positionMode: 'open',
    direction: 'long',
    orderType: 'limit',
    price: '65000.123',
    quantity: '0.01',
    marketPrice: '65000',
    quote: 'USDT',
    base: 'BTC',
    leverage: 10,
  }).reason, '价格需符合步长 0.01');

  assert.equal(getFuturesOrderValidation({
    rule,
    balance,
    positions,
    positionMode: 'open',
    direction: 'long',
    orderType: 'limit',
    price: '65000.12',
    quantity: '0.0005',
    marketPrice: '65000',
    quote: 'USDT',
    base: 'BTC',
    leverage: 10,
  }).reason, '数量不能低于 0.001 BTC');

  assert.equal(getFuturesOrderValidation({
    rule,
    balance: { coinCode: 'USDT', availableBalance: '1' },
    positions,
    positionMode: 'open',
    direction: 'long',
    orderType: 'limit',
    price: '65000.12',
    quantity: '0.01',
    marketPrice: '65000',
    quote: 'USDT',
    base: 'BTC',
    leverage: 10,
  }).reason, 'USDT 可用保证金不足');

  assert.equal(getFuturesOrderValidation({
    rule,
    balance,
    positions,
    positionMode: 'close',
    direction: 'long',
    orderType: 'market',
    price: '',
    quantity: '0.6',
    marketPrice: '65000',
    quote: 'USDT',
    base: 'BTC',
    leverage: 10,
  }).reason, '可平数量不足');

  assert.equal(getFuturesOrderValidation({
    rule,
    balance,
    positions,
    positionMode: 'open',
    direction: 'short',
    orderType: 'market',
    price: '',
    quantity: '0.01',
    marketPrice: '65000',
    quote: 'USDT',
    base: 'BTC',
    leverage: 10,
  }).canSubmit, true);
});
