type ParsedDecimal = {
  units: bigint;
  scale: number;
};

export function normalizeDecimalInput(value: string, maxFractionDigits?: number): string {
  let normalized = '';
  let hasDot = false;
  let fractionDigits = 0;
  const hasFractionLimit = typeof maxFractionDigits === 'number' && maxFractionDigits >= 0;

  for (const char of value) {
    if (char >= '0' && char <= '9') {
      if (hasDot && hasFractionLimit) {
        if (fractionDigits >= maxFractionDigits) continue;
        fractionDigits += 1;
      }
      normalized += char;
      continue;
    }

    if (char === '.' && !hasDot) {
      normalized += char;
      hasDot = true;
    }
  }

  if (normalized.startsWith('.')) return `0${normalized}`;
  return normalized;
}

export function formatDecimalToPrecision(value: string, maxFractionDigits: number): string {
  const normalized = normalizeDecimalInput(value);
  if (!normalized || normalized === '0.') return normalized === '0.' ? '0' : '';
  if (!normalized.includes('.')) return normalized;

  const [integerPart, fractionPart = ''] = normalized.split('.');
  const trimmedFraction = fractionPart.slice(0, Math.max(0, maxFractionDigits)).replace(/0+$/, '');

  return trimmedFraction ? `${integerPart}.${trimmedFraction}` : integerPart;
}

export function multiplyDecimalStrings(left: string, right: string): string {
  const leftParsed = parseDecimal(left);
  const rightParsed = parseDecimal(right);

  if (!leftParsed || !rightParsed) return '';

  return formatScaledInteger(leftParsed.units * rightParsed.units, leftParsed.scale + rightParsed.scale);
}

export function addDecimalStrings(left: string, right: string): string {
  const leftParsed = parseDecimal(left) ?? { units: 0n, scale: 0 };
  const rightParsed = parseDecimal(right) ?? { units: 0n, scale: 0 };
  const scale = Math.max(leftParsed.scale, rightParsed.scale);

  return formatScaledInteger(
    scaleDecimalUnits(leftParsed, scale) + scaleDecimalUnits(rightParsed, scale),
    scale,
  );
}

export function subtractDecimalStrings(left: string, right: string): string {
  const leftParsed = parseDecimal(left) ?? { units: 0n, scale: 0 };
  const rightParsed = parseDecimal(right) ?? { units: 0n, scale: 0 };
  const scale = Math.max(leftParsed.scale, rightParsed.scale);

  return formatScaledInteger(
    scaleDecimalUnits(leftParsed, scale) - scaleDecimalUnits(rightParsed, scale),
    scale,
  );
}

export function floorDecimalAtZero(value: string): string {
  const parsed = parseDecimal(value);
  if (!parsed || parsed.units <= 0n) return '0';

  return formatScaledInteger(parsed.units, parsed.scale);
}

export function floorDecimalToStep(value: string, step: string): string {
  const valueParsed = parseDecimal(value);
  const stepParsed = parseDecimal(step);
  if (!valueParsed) return '';
  if (!stepParsed || stepParsed.units <= 0n) return floorDecimalAtZero(value);
  if (valueParsed.units <= 0n) return '0';

  const scale = Math.max(valueParsed.scale, stepParsed.scale);
  const valueUnits = scaleDecimalUnits(valueParsed, scale);
  const stepUnits = scaleDecimalUnits(stepParsed, scale);
  const flooredUnits = (valueUnits / stepUnits) * stepUnits;

  return formatScaledInteger(flooredUnits, scale);
}

export function divideDecimalStrings(dividend: string, divisor: string, precision = 8): string {
  const dividendParsed = parseDecimal(dividend);
  const divisorParsed = parseDecimal(divisor);

  if (!dividendParsed || !divisorParsed || divisorParsed.units === 0n) return '';

  const scaledDividend = dividendParsed.units * pow10(divisorParsed.scale + precision);
  const scaledDivisor = divisorParsed.units * pow10(dividendParsed.scale);

  return formatScaledInteger(scaledDividend / scaledDivisor, precision);
}

function scaleDecimalUnits(value: ParsedDecimal, targetScale: number): bigint {
  return value.units * pow10(targetScale - value.scale);
}

function parseDecimal(value: string): ParsedDecimal | null {
  const trimmed = value.trim();
  const negative = trimmed.startsWith('-');
  const normalized = normalizeDecimalInput(negative ? trimmed.slice(1) : trimmed);
  if (!normalized || normalized === '.') return null;

  const [integerPart = '', fractionPart = ''] = normalized.split('.');
  const digits = `${integerPart || '0'}${fractionPart}`.replace(/^0+(?=\d)/, '') || '0';

  return {
    units: BigInt(digits) * (negative ? -1n : 1n),
    scale: fractionPart.length,
  };
}

function formatScaledInteger(units: bigint, scale: number): string {
  if (scale <= 0) return units.toString();

  const negative = units < 0n;
  const digits = (negative ? -units : units).toString().padStart(scale + 1, '0');
  const integerPart = digits.slice(0, -scale);
  const fractionPart = digits.slice(-scale).replace(/0+$/, '');
  const sign = negative ? '-' : '';

  return fractionPart ? `${sign}${integerPart}.${fractionPart}` : `${sign}${integerPart}`;
}

function pow10(exponent: number): bigint {
  return 10n ** BigInt(Math.max(0, exponent));
}
