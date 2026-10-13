import { describe, expect, it } from 'vitest';
import type { AxialCode } from '../types/axialCode.ts';
import buildComparisonColors from './buildComparisonColors.ts';
import { compareAxialCodes } from './compareAxialCodes.ts';

const code = (label: string, traceIds: string[]): AxialCode => ({
  label,
  description: '',
  traceIds,
});

describe('buildComparisonColors', () => {
  it('gives a regenerated code the color of the code it comes from', () => {
    const tone = code('Tone', ['t1', 't2', 't3']);
    const escalation = code('Escalation', ['t4', 't5']);
    const renamedTone = code('Friendly tone', ['t1', 't2', 't3']);
    const sameEscalation = code('Escalation', ['t4', 't5']);

    const colors = buildComparisonColors(
      [tone, escalation],
      compareAxialCodes([tone, escalation], [sameEscalation, renamedTone])
    );

    expect(colors.get(renamedTone)).toBe(colors.get(tone));
    expect(colors.get(sameEscalation)).toBe(colors.get(escalation));
    expect(colors.get(tone)).not.toBe(colors.get(escalation));
  });

  it('gives new codes and extra split pieces a color no approved code uses', () => {
    const policy = code('Policy errors', ['t1', 't2', 't3', 't4', 't5']);
    const refund = code('Refund errors', ['t1', 't2', 't3']);
    const warranty = code('Warranty errors', ['t4', 't5']);
    const brandNew = code('Missing order check', ['t6']);

    const colors = buildComparisonColors(
      [policy],
      compareAxialCodes([policy], [refund, warranty, brandNew])
    );

    expect(colors.get(refund)).toBe(colors.get(policy));
    const used = new Set([colors.get(policy), colors.get(warranty), colors.get(brandNew)]);
    expect(used.size).toBe(3);
  });
});
