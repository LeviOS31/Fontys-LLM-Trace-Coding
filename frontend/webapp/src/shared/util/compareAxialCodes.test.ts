import { describe, expect, it } from 'vitest';
import type { AxialCode } from '../types/axialCode.ts';
import { compareAxialCodes } from './compareAxialCodes.ts';

const code = (label: string, traceIds: string[]): AxialCode => ({
  label,
  description: `${label} description`,
  traceIds,
});

describe('compareAxialCodes', () => {
  it('marks a code with the same label and open codes as unchanged', () => {
    const result = compareAxialCodes(
      [code('Hallucination', ['t1', 't2'])],
      [code('hallucination ', ['t2', 't1'])]
    );

    expect(result.changes[0].kind).toBe('unchanged');
    expect(result.removed).toHaveLength(0);
    expect(result.moved).toHaveLength(0);
  });

  it('marks a code with the same open codes but another label as renamed', () => {
    const old = code('Hallucinated policy', ['t1', 't2', 't3']);
    const result = compareAxialCodes([old], [code('Invented refund rules', ['t1', 't2', 't3'])]);

    expect(result.changes[0].kind).toBe('renamed');
    expect(result.changes[0].previous).toEqual([old]);
  });

  it('marks a code that kept its label but gained or lost open codes as changed', () => {
    const result = compareAxialCodes(
      [code('Escalation', ['t1', 't2', 't3'])],
      [code('Escalation', ['t1', 't2', 't4'])]
    );

    const [change] = result.changes;
    expect(change.kind).toBe('changed');
    expect(change.addedTraceIds).toEqual(['t4']);
    expect(change.removedTraceIds).toEqual(['t3']);
  });

  it('marks a code without counterpart as new and an old code without counterpart as removed', () => {
    const old = code('Tone', ['t1', 't2']);
    const result = compareAxialCodes([old], [code('Missing order check', ['t3', 't4'])]);

    expect(result.changes[0].kind).toBe('new');
    expect(result.changes[0].addedTraceIds).toEqual(['t3', 't4']);
    expect(result.removed).toEqual([old]);
    expect(result.counts).toMatchObject({ new: 1, removed: 1 });
  });

  it('marks a code that took most of two old codes as merged', () => {
    const delivery = code('Wrong delivery date', ['t1', 't2']);
    const stock = code('Wrong stock info', ['t3', 't4']);
    const result = compareAxialCodes(
      [delivery, stock],
      [code('Invented order facts', ['t1', 't2', 't3', 't4'])]
    );

    expect(result.changes[0].kind).toBe('merged');
    expect(result.changes[0].previous).toEqual([delivery, stock]);
    expect(result.removed).toHaveLength(0);
  });

  it('marks the pieces of a divided old code as split', () => {
    const old = code('Policy errors', ['t1', 't2', 't3', 't4', 't5']);
    const result = compareAxialCodes(
      [old],
      [code('Refund policy errors', ['t1', 't2', 't3']), code('Warranty errors', ['t4', 't5'])]
    );

    expect(result.changes.map((change) => change.kind)).toEqual(['split', 'split']);
    expect(result.changes.every((change) => change.previous[0] === old)).toBe(true);
    expect(result.moved).toHaveLength(0);
  });

  it('lists the open codes that moved to a code that does not descend from their old code', () => {
    const tone = code('Tone', ['t1', 't2', 't3']);
    const escalation = code('Escalation', ['t4', 't5', 't6']);
    const result = compareAxialCodes(
      [tone, escalation],
      [code('Tone', ['t1', 't2']), code('Escalation', ['t3', 't4', 't5', 't6'])]
    );

    expect(result.moved).toHaveLength(1);
    expect(result.moved[0]).toMatchObject({ traceId: 't3', from: tone });
    expect(result.moved[0].to.label).toBe('Escalation');
  });

  it('matches codes without open codes on their label', () => {
    const result = compareAxialCodes([code('Empty', [])], [code('Empty', [])]);

    expect(result.changes[0].kind).toBe('unchanged');
    expect(result.removed).toHaveLength(0);
  });

  it('handles empty versions', () => {
    expect(compareAxialCodes([], []).changes).toEqual([]);
    expect(compareAxialCodes([code('Tone', ['t1'])], []).removed).toHaveLength(1);
  });
});
