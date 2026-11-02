import { describe, expect, it } from 'vitest';
import {
  formatDate,
  formatPercent,
  isJudgeResponse,
  isOk,
  isTrue,
  statsFromCounts,
  type JudgeResult,
} from '../judgeUtils';

const result = (overrides: Partial<JudgeResult> = {}): JudgeResult => ({
  traceId: 'trace-1',
  status: 'success',
  verdict: 'true',
  reasoning: 'Because',
  error: null,
  ...overrides,
});

describe('isJudgeResponse', () => {
  it('accepts an object with a results array', () => {
    expect(isJudgeResponse({ judgeRunId: 'run-1', results: [] })).toBe(true);
  });

  it.each([null, undefined, 'text', 42, {}, { results: 'nope' }])('rejects %j', (value) => {
    expect(isJudgeResponse(value)).toBe(false);
  });
});

describe('isOk', () => {
  it('is case-insensitive on the status', () => {
    expect(isOk(result({ status: 'SUCCESS' }))).toBe(true);
    expect(isOk(result({ status: 'Success' }))).toBe(true);
  });

  it('is false for any other status', () => {
    expect(isOk(result({ status: 'failed' }))).toBe(false);
  });
});

describe('isTrue', () => {
  it('is true for a successful result with a true verdict, ignoring case', () => {
    expect(isTrue(result({ verdict: 'TRUE' }))).toBe(true);
  });

  it('is false for a false verdict', () => {
    expect(isTrue(result({ verdict: 'false' }))).toBe(false);
  });

  it('is false when the result failed, even with a true verdict', () => {
    expect(isTrue(result({ status: 'failed', verdict: 'true' }))).toBe(false);
  });

  it('is false when the verdict is null', () => {
    expect(isTrue(result({ verdict: null }))).toBe(false);
  });
});

describe('statsFromCounts', () => {
  it('computes rates relative to the total', () => {
    const stats = statsFromCounts({
      totalCount: 3,
      trueCount: 2,
      falseCount: 1,
      failedCount: 0,
    });
    expect(stats.total).toBe(3);
    expect(stats.trueCount).toBe(2);
    expect(stats.falseCount).toBe(1);
    expect(stats.failedCount).toBe(0);
    expect(stats.trueRate).toBeCloseTo(2 / 3);
    expect(stats.falseRate).toBeCloseTo(1 / 3);
  });

  it('returns null rates when there are no results', () => {
    const stats = statsFromCounts({
      totalCount: 0,
      trueCount: 0,
      falseCount: 0,
      failedCount: 0,
    });
    expect(stats.trueRate).toBeNull();
    expect(stats.falseRate).toBeNull();
  });
});

describe('formatPercent', () => {
  it('formats a fraction with one decimal', () => {
    expect(formatPercent(0.6)).toBe('60.0%');
    expect(formatPercent(2 / 3)).toBe('66.7%');
    expect(formatPercent(0)).toBe('0.0%');
    expect(formatPercent(1)).toBe('100.0%');
  });

  it('shows a dash for null', () => {
    expect(formatPercent(null)).toBe('–');
  });
});

describe('formatDate', () => {
  it('formats an ISO date in the en-US style', () => {
    // Midday UTC keeps the day within 14/15 January for every timezone offset.
    expect(formatDate('2025-01-15T12:00:00Z')).toMatch(/Jan 1[45], 2025/);
  });
});
