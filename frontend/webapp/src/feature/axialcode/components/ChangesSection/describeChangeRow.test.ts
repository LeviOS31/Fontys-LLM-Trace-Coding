import { describe, expect, it } from 'vitest';
import type { AxialCode } from '../../../../shared/types/axialCode.ts';
import { compareAxialCodes } from '../../../../shared/util/compareAxialCodes.ts';
import { buildChangeRows } from './buildChangeRows.ts';
import { describeChangeRow } from './describeChangeRow.ts';

const code = (label: string, traceIds: string[], description = ''): AxialCode => ({
  label,
  description,
  traceIds,
});

const describeAll = (previous: AxialCode[], next: AxialCode[]) =>
  buildChangeRows(compareAxialCodes(previous, next)).map((row) => ({
    row,
    details: describeChangeRow(row, previous, next),
  }));

const ids = (refs: readonly { traceId: string }[]) => refs.map((ref) => ref.traceId);

describe('describeChangeRow', () => {
  it('shows which open codes went to which piece of a split', () => {
    const [{ details }] = describeAll(
      [code('Policy errors', ['t1', 't2', 't3', 't4', 't5'])],
      [code('Refund errors', ['t1', 't2', 't3']), code('Warranty errors', ['t4', 't5'])]
    );

    expect(details.summary).toBe('"Policy errors" was split into 2 codes.');
    expect(details.groups.map((group) => [group.target.label, ids(group.kept)])).toEqual([
      ['Refund errors', ['t1', 't2', 't3']],
      ['Warranty errors', ['t4', 't5']],
    ]);
    expect(details.left).toEqual([]);
  });

  it('tells where the added open codes came from and where the leaving ones went', () => {
    const tone = code('Tone', ['t1', 't2', 't3']);
    const escalation = code('Escalation', ['t4', 't5', 't6']);
    const newTone = code('Tone', ['t1', 't2']);
    const newEscalation = code('Escalation', ['t3', 't4', 't5', 't6']);
    const result = describeAll([tone, escalation], [newTone, newEscalation]);

    const toneDetails = result.find(
      ({ row }) => row.kind === 'changed' && row.to.code === newTone
    )!.details;
    expect(toneDetails.summary).toBe('"Tone" kept its name; 1 open code left it.');
    expect(toneDetails.left).toEqual([{ traceId: 't3', other: newEscalation }]);

    const escalationDetails = result.find(
      ({ row }) => row.kind === 'changed' && row.to.code === newEscalation
    )!.details;
    expect(escalationDetails.groups[0].added).toEqual([{ traceId: 't3', other: tone }]);
  });

  it('explains a rename and shows the old and new description', () => {
    const [{ details }] = describeAll(
      [code('Hallucinated policy', ['t1', 't2'], 'Invents policy rules')],
      [code('Invented refund rules', ['t1', 't2'], 'Makes up refund conditions')]
    );

    expect(details.summary).toBe(
      '"Hallucinated policy" was renamed to "Invented refund rules". It keeps 2 of its 2 open codes.'
    );
    expect(details.description).toEqual({
      before: 'Invents policy rules',
      after: 'Makes up refund conditions',
    });
  });

  it('names the codes of a merge and where each kept open code comes from', () => {
    const delivery = code('Wrong delivery date', ['t1', 't2']);
    const stock = code('Wrong stock info', ['t3', 't4']);
    const [{ details }] = describeAll(
      [delivery, stock],
      [code('Invented order facts', ['t1', 't2', 't3', 't4'])]
    );

    expect(details.summary).toBe(
      '"Wrong delivery date" and "Wrong stock info" were merged into "Invented order facts".'
    );
    expect(details.groups[0].kept.map((ref) => ref.other)).toEqual([
      delivery,
      delivery,
      stock,
      stock,
    ]);
  });

  it('lists where the open codes of a removed code went', () => {
    // Each open code of "Poor communication" goes to a different code, so none holds most of it.
    const poor = code('Poor communication', ['t7', 't8', 't9']);
    const halluc = code('Hallucination', ['t1', 't2', 't7']);
    const guidance = code('Clear guidance', ['t3', 't4', 't8']);
    const escalation = code('Escalation', ['t5', 't6', 't9']);
    const result = describeAll(
      [
        code('Hallucination', ['t1', 't2']),
        code('Clear guidance', ['t3', 't4']),
        code('Escalation', ['t5', 't6']),
        poor,
      ],
      [halluc, guidance, escalation]
    );

    const removed = result.find(({ row }) => row.kind === 'removed')!.details;
    expect(removed.summary).toBe(
      '"Poor communication" no longer exists. Its 3 open codes went elsewhere.'
    );
    expect(removed.left).toEqual([
      { traceId: 't7', other: halluc },
      { traceId: 't8', other: guidance },
      { traceId: 't9', other: escalation },
    ]);
  });
});
