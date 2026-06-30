type NullableNumber = number | null | undefined;

export function formatNullableMarketPrice(value: NullableNumber): string {
  if (!isFiniteNumber(value)) return '--';
  if (value >= 1000) return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (value >= 1) return value.toFixed(2);
  if (value >= 0.01) return value.toFixed(4);
  return value.toFixed(6);
}

export function formatNullableMarketPercent(value: NullableNumber): string {
  if (!isFiniteNumber(value)) return '--';
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

export function getNullableChangeClass(value: NullableNumber): string {
  if (!isFiniteNumber(value)) return 'text-muted-foreground';
  return value >= 0 ? 'text-buy' : 'text-sell';
}

export function formatNullableMarketVolume(value: NullableNumber): string {
  if (!isFiniteNumber(value)) return '--';
  if (value >= 1000000000) return `${(value / 1000000000).toFixed(2)}B`;
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toFixed(2);
}

export function formatFuturesFundingRate(value: NullableNumber): string {
  if (!isFiniteNumber(value)) return '--';
  return `${(value * 100).toFixed(4)}%`;
}

export function formatFuturesFundingTime(value: NullableNumber): string {
  if (!isFiniteNumber(value)) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function isFiniteNumber(value: NullableNumber): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
