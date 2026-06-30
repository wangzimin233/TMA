import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  formatFuturesFundingRate,
  formatFuturesFundingTime,
  formatNullableMarketPercent,
  formatNullableMarketPrice,
  getNullableChangeClass,
} from './futures-market';

test('formats nullable futures market values as stable display text', () => {
  assert.equal(formatNullableMarketPrice(null), '--');
  assert.equal(formatNullableMarketPrice(undefined), '--');
  assert.equal(formatNullableMarketPrice(550.53), '550.53');
  assert.equal(formatNullableMarketPercent(null), '--');
  assert.equal(formatNullableMarketPercent(0.195), '+0.20%');
  assert.equal(formatNullableMarketPercent(-0.896), '-0.90%');
  assert.equal(getNullableChangeClass(null), 'text-muted-foreground');
  assert.equal(getNullableChangeClass(0), 'text-buy');
});

test('formats futures funding fields without assuming data is present', () => {
  assert.equal(formatFuturesFundingRate(null), '--');
  assert.equal(formatFuturesFundingRate(0), '0.0000%');
  assert.equal(formatFuturesFundingRate(0.00004073), '0.0041%');
  assert.equal(formatFuturesFundingTime(null), '--');
  assert.match(formatFuturesFundingTime(1782835200000), /^\d{2}:\d{2}$/);
});
