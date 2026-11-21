import test from 'node:test';
import assert from 'node:assert/strict';
import { calculate, toSatang } from './dist/calculator.js';
const people = amounts => amounts.map(amount => ({ amount: String(amount) }));
test('provided bill matches all three expected payments exactly', () => {
  const result = calculate(people([90, 180, 95]), '17', '135.25');
  assert.equal(result.total, 24675);
  assert.deepEqual(result.shares.map(s => s.payable), [6084, 12169, 6422]);
});
test('rounding distributes satang without changing total', () => {
  assert.deepEqual(calculate(people([1, 1, 1]), '0', '0.02').shares.map(s => s.payable), [100, 99, 99]);
});
test('zero, free bill, delivery only, and invalid amounts', () => {
  assert.deepEqual(calculate(people([0, 50]), '10', '0').shares.map(s => s.payable), [0, 6000]);
  assert.equal(calculate(people([50]), '10', '60').shares[0].payable, 0);
  assert.throws(() => calculate(people([0]), '10', '0'));
  assert.throws(() => calculate(people([10]), '0', '11'));
  for (const invalid of ['-1', '1.234', 'NaN', 'Infinity', '1e3', '1000001', ' ']) assert.throws(() => toSatang(invalid));
  assert.equal(toSatang('60.84'), 6084);
});
test('generated bills always preserve totals with at most one satang rounding per person', () => {
  for (let n = 1; n <= 100; n++) {
    const p = people(Array.from({length:n}, (_, i) => ((i * 73 + n * 17) % 501 + 1) / 100));
    const result = calculate(p, '17.13', '0.01');
    assert.equal(result.shares.reduce((sum, s) => sum + s.payable, 0), result.total);
    for (const s of result.shares) { assert.ok(s.payable >= 0); assert.ok(Math.abs(s.payable - result.total * s.amount / result.subtotal) < 1.000001); }
  }
});
