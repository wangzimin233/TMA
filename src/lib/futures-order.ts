import { divideDecimalStrings, floorDecimalToStep, multiplyDecimalStrings } from './decimal';
import { compareDecimals, isMultipleOfStep } from './spot-order';

export type FuturesPositionMode = 'open' | 'close';
export type FuturesOrderDirection = 'long' | 'short';
export type FuturesOrderType = 'limit' | 'market';
export type FuturesTradeAction = 'OPEN_LONG' | 'OPEN_SHORT' | 'CLOSE_LONG' | 'CLOSE_SHORT';
export type FuturesTimeInForce = 'GTC' | 'IOC' | 'FOK';
export type FuturesQuantityUnit = 'base' | 'quote';

export type FuturesOrderRule = {
  futuresTradable?: boolean;
  minPrice?: string;
  maxPrice?: string;
  tickSize?: string;
  minQty?: string;
  maxQty?: string;
  stepSize?: string;
  minNotional?: string;
};

export type FuturesOrderBalance = {
  coinCode: string;
  availableBalance: string;
};

export type FuturesOrderPosition = {
  positionSide: 'LONG' | 'SHORT' | string;
  availableQty: string;
};

export type FuturesOrderValidationInput = {
  rule?: FuturesOrderRule;
  balance?: FuturesOrderBalance;
  positions: FuturesOrderPosition[];
  positionMode: FuturesPositionMode;
  direction: FuturesOrderDirection;
  orderType: FuturesOrderType;
  price: string;
  quantity: string;
  marketPrice: string;
  quote: string;
  base: string;
  leverage: number;
};

export type FuturesOrderValidation = {
  canSubmit: boolean;
  reason?: string;
  notional?: string;
  requiredMargin?: string;
  closeAvailableQty?: string;
};

export type FuturesOrderPayloadInput = {
  symbolCode: string;
  positionMode: FuturesPositionMode;
  direction: FuturesOrderDirection;
  orderType: FuturesOrderType;
  price: string;
  quantity: string;
  leverage?: number;
  timeInForce?: FuturesTimeInForce;
};

export type FuturesQuantityUnitInput = {
  quantity: string;
  unit: FuturesQuantityUnit;
  referencePrice: string;
  stepSize?: string;
};

export type FuturesQuantityUnitSwitchInput = {
  value: string;
  fromUnit: FuturesQuantityUnit;
  toUnit: FuturesQuantityUnit;
  referencePrice: string;
  stepSize?: string;
};

export type FuturesPlaceOrderPayload = {
  symbolCode: string;
  tradeAction: FuturesTradeAction;
  orderType: 'LIMIT' | 'MARKET';
  timeInForce?: FuturesTimeInForce;
  price?: number;
  quantity: number;
  leverage?: number;
  remark?: string;
};

export function getFuturesOrderValidation(input: FuturesOrderValidationInput): FuturesOrderValidation {
  const { rule, balance, positions, positionMode, direction, orderType, price, quantity, marketPrice, quote, base, leverage } = input;

  if (!rule) return invalid('交易规则加载中');
  if (!rule.futuresTradable) return invalid('当前合约暂不可交易');

  const effectivePrice = orderType === 'limit' ? price : marketPrice;
  if (orderType === 'limit') {
    if (!isPositiveDecimal(price)) return invalid('请输入委托价格');
    if (rule.minPrice && compareDecimals(price, rule.minPrice) < 0) return invalid(`价格不能低于 ${rule.minPrice}`);
    if (rule.maxPrice && compareDecimals(price, rule.maxPrice) > 0) return invalid(`价格不能高于 ${rule.maxPrice}`);
    if (rule.tickSize && !isMultipleOfStep(price, rule.tickSize)) return invalid(`价格需符合步长 ${rule.tickSize}`);
  } else if (!isPositiveDecimal(marketPrice)) {
    return invalid('行情价格加载中');
  }

  if (!isPositiveDecimal(quantity)) return invalid('请输入委托数量');
  if (rule.minQty && compareDecimals(quantity, rule.minQty) < 0) return invalid(`数量不能低于 ${rule.minQty} ${base}`);
  if (rule.maxQty && compareDecimals(quantity, rule.maxQty) > 0) return invalid(`数量不能高于 ${rule.maxQty} ${base}`);
  if (rule.stepSize && !isMultipleOfStep(quantity, rule.stepSize)) return invalid(`数量需符合步长 ${rule.stepSize}`);

  const notional = multiplyDecimalStrings(effectivePrice, quantity);
  if (rule.minNotional && compareDecimals(notional, rule.minNotional) < 0) {
    return invalid(`名义价值不能低于 ${rule.minNotional} ${quote}`, undefined, notional);
  }

  if (positionMode === 'close') {
    const closeAvailableQty = getCloseAvailableQty(positions, direction);
    if (compareDecimals(quantity, closeAvailableQty) > 0) {
      return invalid('可平数量不足', undefined, notional, closeAvailableQty);
    }

    return {
      canSubmit: true,
      notional,
      closeAvailableQty,
    };
  }

  const safeLeverage = Number.isFinite(leverage) && leverage > 0 ? leverage : 1;
  const requiredMargin = divideDecimalStrings(notional, String(safeLeverage), 18);
  const availableBalance = balance?.availableBalance ?? '0';
  if (compareDecimals(requiredMargin, availableBalance) > 0) {
    return invalid(`${balance?.coinCode ?? quote} 可用保证金不足`, requiredMargin, notional);
  }

  return {
    canSubmit: true,
    notional,
    requiredMargin,
  };
}

export function buildFuturesOrderPayload(input: FuturesOrderPayloadInput): FuturesPlaceOrderPayload {
  const tradeAction = getFuturesTradeAction(input.positionMode, input.direction);
  const payload: FuturesPlaceOrderPayload = {
    symbolCode: input.symbolCode,
    tradeAction,
    orderType: input.orderType === 'limit' ? 'LIMIT' : 'MARKET',
    quantity: decimalStringToApiNumber(input.quantity),
    remark: `用户主动${formatTradeActionRemark(tradeAction)}`,
  };

  if (typeof input.leverage === 'number' && Number.isFinite(input.leverage) && input.leverage > 0) {
    payload.leverage = input.leverage;
  }

  if (input.orderType === 'limit') {
    payload.timeInForce = input.timeInForce ?? 'GTC';
    payload.price = decimalStringToApiNumber(input.price);
  }

  return payload;
}

export function getFuturesBaseQuantityFromUnit(input: FuturesQuantityUnitInput): string {
  if (input.unit === 'base') return input.quantity;
  if (!isPositiveDecimal(input.quantity) || !isPositiveDecimal(input.referencePrice)) return '';

  const baseQuantity = divideDecimalStrings(input.quantity, input.referencePrice, 18);
  if (!input.stepSize) return baseQuantity;

  return floorDecimalToStep(baseQuantity, input.stepSize);
}

export function convertFuturesQuantityUnit(input: FuturesQuantityUnitSwitchInput): string | null {
  if (input.fromUnit === input.toUnit) return input.value;
  if (!input.value) return '';
  if (!isPositiveDecimal(input.referencePrice)) return null;

  if (input.fromUnit === 'base') {
    return multiplyDecimalStrings(input.value, input.referencePrice);
  }

  return getFuturesBaseQuantityFromUnit({
    quantity: input.value,
    unit: 'quote',
    referencePrice: input.referencePrice,
    stepSize: input.stepSize,
  });
}

export function getFuturesTradeAction(positionMode: FuturesPositionMode, direction: FuturesOrderDirection): FuturesTradeAction {
  if (positionMode === 'open') return direction === 'long' ? 'OPEN_LONG' : 'OPEN_SHORT';
  return direction === 'long' ? 'CLOSE_LONG' : 'CLOSE_SHORT';
}

export function getCloseAvailableQty(positions: FuturesOrderPosition[], direction: FuturesOrderDirection): string {
  const targetSide = direction === 'long' ? 'LONG' : 'SHORT';
  const position = positions.find((item) => item.positionSide === targetSide);
  return position?.availableQty || '0';
}

function invalid(reason: string, requiredMargin?: string, notional?: string, closeAvailableQty?: string): FuturesOrderValidation {
  return {
    canSubmit: false,
    reason,
    requiredMargin,
    notional,
    closeAvailableQty,
  };
}

function isPositiveDecimal(value: string): boolean {
  return compareDecimals(value, '0') > 0;
}

function decimalStringToApiNumber(value: string): number {
  return Number(value);
}

function formatTradeActionRemark(action: FuturesTradeAction): string {
  const labelMap: Record<FuturesTradeAction, string> = {
    OPEN_LONG: '开多',
    OPEN_SHORT: '开空',
    CLOSE_LONG: '平多',
    CLOSE_SHORT: '平空',
  };

  return labelMap[action];
}
