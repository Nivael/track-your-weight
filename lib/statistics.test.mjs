import test from 'node:test';
import assert from 'node:assert/strict';
import { weekRange, metric } from './statistics.ts';
test('自然周在周一换周，支持跨年', () => {
  assert.deepEqual(weekRange('2026-09-13'), ['2026-09-07', '2026-09-13']);
  assert.deepEqual(weekRange('2026-09-14'), ['2026-09-14', '2026-09-20']);
  assert.deepEqual(weekRange('2027-01-01'), ['2026-12-28', '2027-01-03']);
});
test('均值排除空值与无效值，保留明确的零', () => {
  assert.deepEqual(
    metric([{ v: '' }, { v: '0' }, { v: '100' }, { v: 'unknown' }, {}], 'v'),
    { total: 100, count: 2, mean: 50 },
  );
  assert.equal(metric([], 'v').mean, null);
});
