import { describe, expect, it } from 'vitest';
import type { AxialCode } from '../../../../shared/types/axialCode.ts';
import { compareAxialCodes } from '../../../../shared/util/compareAxialCodes.ts';
import { buildChangeRows } from './buildChangeRows.ts';

const code = (label: string, traceIds: string[]): AxialCode => ({
  label,
  description: '',
  traceIds,
});

describe('buildChangeRows', () => {
  it('groups the pieces of a split under the code they come from', () => {
    const policy = code('Policy errors', ['t1', 't2', 't3', 't4', 't5']);
    const rows = buildChangeRows(
      compareAxialCodes(
        [policy],
        [code('Refund errors', ['t1', 't2', 't3']), code('Warranty errors', ['t4', 't5'])]
      )
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ kind: 'split', from: policy });
    expect(rows[0].kind === 'split' && rows[0].to.map((change) => change.code.label)).toEqual([
      'Refund errors',
      'Warranty errors',
    ]);
  });

  it('lists the removed codes and orders the rows from most to least significant', () => {
    const rows = buildChangeRows(
      compareAxialCodes(
        [code('Tone', ['t1', 't2']), code('Escalation', ['t3', 't4']), code('Speed', ['t5'])],
        [code('Escalation', ['t3', 't4']), code('Speed issues', ['t5']), code('Trust', ['t6'])]
      )
    );

    expect(rows.map((row) => row.kind)).toEqual(['renamed', 'new', 'removed', 'unchanged']);
    expect(rows[2]).toMatchObject({ kind: 'removed', from: { label: 'Tone' } });
  });
});
