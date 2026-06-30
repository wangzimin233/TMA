import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addDecimalStrings, divideDecimalStrings, floorDecimalAtZero, floorDecimalToStep, formatDecimalToPrecision, multiplyDecimalStrings, normalizeDecimalInput, subtractDecimalStrings } from './decimal';

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

test('limits decimal input to configured fraction digits without rounding', () => {
  assert.equal(normalizeDecimalInput('1.0943999999999999', 8), '1.09439999');
  assert.equal(normalizeDecimalInput('547.1599', 2), '547.15');
  assert.equal(normalizeDecimalInput('0.002999', 3), '0.002');
  assert.equal(normalizeDecimalInput('.', 8), '0.');
  assert.equal(normalizeDecimalInput('0.', 8), '0.');
  assert.equal(normalizeDecimalInput('', 8), '');
});

test('formats decimal display by truncating to configured precision', () => {
  assert.equal(formatDecimalToPrecision('0.000009091074383170603', 8), '0.00000909');
  assert.equal(formatDecimalToPrecision('1.23000000', 8), '1.23');
  assert.equal(formatDecimalToPrecision('5', 8), '5');
  assert.equal(formatDecimalToPrecision('', 8), '');
});

test('adds and subtracts decimal strings by trading step without float drift', () => {
  assert.equal(addDecimalStrings('554.62', '0.01'), '554.63');
  assert.equal(addDecimalStrings('', '0.001'), '0.001');
  assert.equal(subtractDecimalStrings('0.003', '0.001'), '0.002');
  assert.equal(floorDecimalAtZero(subtractDecimalStrings('0.001', '0.01')), '0');
});

test('floors computed order quantity to the exchange step size', () => {
  assert.equal(floorDecimalToStep('0.00381788', '0.001'), '0.003');
  assert.equal(floorDecimalToStep('1.239', '0.01'), '1.23');
  assert.equal(floorDecimalToStep('0.0009', '0.001'), '0');
  assert.equal(floorDecimalToStep('2.5', ''), '2.5');
});

test('keeps quote amount editable while flooring derived quantity', () => {
  const quoteAmount = '2.1001776092';
  const rawQuantity = divideDecimalStrings(quoteAmount, '550.09', 18);

  assert.equal(floorDecimalToStep(rawQuantity, '0.001'), '0.003');
  assert.equal(quoteAmount, '2.1001776092');
});
