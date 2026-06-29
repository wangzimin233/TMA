import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addDecimalStrings, divideDecimalStrings, floorDecimalAtZero, multiplyDecimalStrings, normalizeDecimalInput, subtractDecimalStrings } from './decimal';

test('multiplies price and quantity without floating point drift', () => {
  assert.equal(multiplyDecimalStrings('553.81', '0.020'), '11.0762');
  assert.equal(multiplyDecimalStrings('0.1', '0.2'), '0.02');
});

test('divides quote amount by price for base quantity', () => {
  assert.equal(divideDecimalStrings('11.0762', '553.81', 8), '0.02');
  assert.equal(divideDecimalStrings('1', '3', 8), '0.33333333');
});

test('normalizes user decimal input for form state', () => {
  assert.equal(normalizeDecimalInput('001.2300'), '001.2300');
  assert.equal(normalizeDecimalInput('12..3abc4'), '12.34');
  assert.equal(normalizeDecimalInput('.5'), '0.5');
});

test('adds and subtracts decimal strings by trading step without float drift', () => {
  assert.equal(addDecimalStrings('554.62', '0.01'), '554.63');
  assert.equal(addDecimalStrings('', '0.001'), '0.001');
  assert.equal(subtractDecimalStrings('0.003', '0.001'), '0.002');
  assert.equal(floorDecimalAtZero(subtractDecimalStrings('0.001', '0.01')), '0');
});
