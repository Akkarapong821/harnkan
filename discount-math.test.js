import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateDiscount } from './dist/discount-math.js';

test('combines coupons, delivery savings and percentage discounts', () => {
  assert.equal(evaluateDiscount('17 + 18.25 + 100'), '135.25');
  assert.equal(evaluateDiscount('17 + 365 × 5% + 100'), '135.25');
  assert.equal(evaluateDiscount('(100 + 50) * 10%'), '15.00');
});
test('respects precedence, unary signs and decimal rounding', () => {
  assert.equal(evaluateDiscount('100 − 20 ÷ 2'), '90.00');
  assert.equal(evaluateDiscount('-5 + 10'), '5.00');
  assert.equal(evaluateDiscount('0.1 + 0.2'), '0.30');
  assert.equal(evaluateDiscount('1.005'), '1.01');
  assert.equal(evaluateDiscount('1 / 3 * 3'), '1.00');
  assert.equal(evaluateDiscount('.5 + 0'), '0.50');
  assert.equal(evaluateDiscount('0 * 100'), '0.00');
});
test('rejects division by zero, incomplete input and non-arithmetic content', () => {
  for (const text of ['', '5+', '10 / 0', '10 / (2-2)', '(2+3', '2 3', '3..2', 'alert(1)', '1;2', '1'.repeat(161)]) {
    assert.throws(() => evaluateDiscount(text), text);
  }
});
