import { divideDecimalStrings, multiplyDecimalStrings } from './decimal';

export type SpotOrderSide = 'buy' | 'sell';
export type SpotOrderType = 'limit' | 'market';

export type SpotOrderRule = {
  spotTradingAllowed?: boolean;
  spotTradable?: boolean;
  orderTypes?: string[];
  quoteOrderQtyMarketAllowed?: boolean;
  minPrice?: string;
  maxPrice?: string;
  tickSize?: string;
  minQty?: string;
  maxQty?: string;
  stepSize?: string;
  minNotional?: string;
};

export type SpotOrderBalance = {
  coinCode: string;
  availableBalance: string;
};

export type SpotOrderValidationInput = {
  rule?: SpotOrderRule;
  balances: Record<string, SpotOrderBalance | undefined>;
  base: string;
  quote: string;
  side: SpotOrderSide;
  orderType: SpotOrderType;
  price: string;
  quantity: string;
  amount: string;
  marketPrice: string;
};

export type SpotOrderValidation = {
  canSubmit: boolean;
  reason?: string;
  requiredCoinCode?: string;
  requiredAmount?: string;
  notional?: string;
};

export type SpotOrderPayloadInput = {
  symbolCode: string;
  side: SpotOrderSide;
  orderType: SpotOrderType;
  price: string;
  quantity: string;
  amount: string;
};

export type SpotOrderPayload = {
  symbolCode: string;
  side: 'BUY' | 'SELL';
  orderType: 'LIMIT' | 'MARKET';
  timeInForce?: 'GTC';
  price?: number;
  quantity?: number;
  quoteAmount?: number;
};

export function getSpotOrderValidation(input: SpotOrderValidationInput): SpotOrderValidation {
  const { rule, balances, base, quote, side, orderType, price, quantity, amount, marketPrice } = input;
  const apiOrderType = orderType.toUpperCase();

  if (!rule) return invalid('交易规则加载中');
  if (!rule.spotTradingAllowed || !rule.spotTradable) return invalid('当前交易对暂不可交易');
  if (rule.orderTypes?.length && !rule.orderTypes.includes(apiOrderType)) return invalid(`当前交易对不支持${orderType === 'limit' ? '限价单' : '市价单'}`);

  if (orderType === 'limit') {
    if (!isPositiveDecimal(price)) return invalid('请输入委托价格');
    if (!isPositiveDecimal(quantity)) return invalid('请输入委托数量');
    if (rule.minPrice && compareDecimals(price, rule.minPrice) < 0) return invalid(`价格不能低于 ${rule.minPrice}`);
    if (rule.maxPrice && compareDecimals(price, rule.maxPrice) > 0) return invalid(`价格不能高于 ${rule.maxPrice}`);
    if (rule.tickSize && !isMultipleOfStep(price, rule.tickSize)) return invalid(`价格需符合步长 ${rule.tickSize}`);
  }

  if (orderType === 'market' && side === 'buy') {
    if (!isPositiveDecimal(amount)) return invalid(`请输入买入金额`);
    if (rule.quoteOrderQtyMarketAllowed === false) return invalid('当前交易对不支持按金额市价买入');
  } else {
    if (!isPositiveDecimal(quantity)) return invalid('请输入委托数量');
  }

  const effectivePrice = orderType === 'limit' ? price : marketPrice;
  const effectiveQuantity = orderType === 'market' && side === 'buy'
    ? divideDecimalStrings(amount, effectivePrice, 18)
    : quantity;

  if (orderType !== 'market' || side === 'sell') {
    if (rule.minQty && compareDecimals(quantity, rule.minQty) < 0) return invalid(`数量不能低于 ${rule.minQty} ${base}`);
    if (rule.maxQty && compareDecimals(quantity, rule.maxQty) > 0) return invalid(`数量不能高于 ${rule.maxQty} ${base}`);
    if (rule.stepSize && !isMultipleOfStep(quantity, rule.stepSize)) return invalid(`数量需符合步长 ${rule.stepSize}`);
  }

  const notional = orderType === 'market' && side === 'buy'
    ? amount
    : multiplyDecimalStrings(effectivePrice, effectiveQuantity);
  if (rule.minNotional && compareDecimals(notional, rule.minNotional) < 0) {
    const label = orderType === 'market' && side === 'buy' ? '成交金额' : '实际下单金额';
    return invalid(`${label}不能低于 ${rule.minNotional} ${quote}`, undefined, undefined, notional);
  }

  const requiredCoinCode = side === 'buy' ? quote : base;
  const requiredAmount = side === 'buy'
    ? (orderType === 'market' ? amount : notional)
    : quantity;
  const availableBalance = balances[requiredCoinCode]?.availableBalance ?? '0';

  if (compareDecimals(requiredAmount, availableBalance) > 0) {
    return invalid(`${requiredCoinCode} 可用余额不足`, requiredCoinCode, requiredAmount, notional);
  }

  return {
    canSubmit: true,
    requiredCoinCode,
    requiredAmount,
    notional,
  };
}

export function buildSpotOrderPayload(input: SpotOrderPayloadInput): SpotOrderPayload {
  const payload: SpotOrderPayload = {
    symbolCode: input.symbolCode,
    side: input.side === 'buy' ? 'BUY' : 'SELL',
    orderType: input.orderType === 'limit' ? 'LIMIT' : 'MARKET',
  };

  if (input.orderType === 'limit') {
    payload.timeInForce = 'GTC';
    payload.price = decimalStringToApiNumber(input.price);
    payload.quantity = decimalStringToApiNumber(input.quantity);
    return payload;
  }

  if (input.side === 'buy') {
    payload.quoteAmount = decimalStringToApiNumber(input.amount || input.quantity);
    return payload;
  }

  payload.quantity = decimalStringToApiNumber(input.quantity);
  return payload;
}

export function compareDecimals(left: string, right: string): number {
  const leftParsed = parseDecimalParts(left);
  const rightParsed = parseDecimalParts(right);
  const scale = Math.max(leftParsed.scale, rightParsed.scale);
  const leftUnits = leftParsed.units * pow10(scale - leftParsed.scale);
  const rightUnits = rightParsed.units * pow10(scale - rightParsed.scale);

  if (leftUnits === rightUnits) return 0;
  return leftUnits > rightUnits ? 1 : -1;
}

export function isMultipleOfStep(value: string, step: string): boolean {
  const valueParsed = parseDecimalParts(value);
  const stepParsed = parseDecimalParts(step);
  if (stepParsed.units <= 0n) return true;

  const scale = Math.max(valueParsed.scale, stepParsed.scale);
  const valueUnits = valueParsed.units * pow10(scale - valueParsed.scale);
  const stepUnits = stepParsed.units * pow10(scale - stepParsed.scale);

  return valueUnits % stepUnits === 0n;
}

function invalid(reason: string, requiredCoinCode?: string, requiredAmount?: string, notional?: string): SpotOrderValidation {
  return {
    canSubmit: false,
    reason,
    requiredCoinCode,
    requiredAmount,
    notional,
  };
}

function isPositiveDecimal(value: string): boolean {
  return compareDecimals(value, '0') > 0;
}

function decimalStringToApiNumber(value: string): number {
  return Number(value);
}

function parseDecimalParts(value: string) {
  const normalized = value.trim();
  if (!normalized) return { units: 0n, scale: 0 };

  const [integerPart = '0', fractionPart = ''] = normalized.split('.');
  const digits = `${integerPart || '0'}${fractionPart}`.replace(/^0+(?=\d)/, '') || '0';

  return {
    units: BigInt(digits),
    scale: fractionPart.length,
  };
}

function pow10(exponent: number): bigint {
  return 10n ** BigInt(Math.max(0, exponent));
}
