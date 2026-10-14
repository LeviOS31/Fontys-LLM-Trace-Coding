import '@testing-library/jest-dom/vitest';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAxialCodeTraceStatus } from '../useAxialCodeTraceStatus';

const { getCurrentAxialCodes } = vi.hoisted(() => ({ getCurrentAxialCodes: vi.fn() }));

vi.mock('../../../axialcode/hooks/useGetCurrentAxialCodesOfVersion', () => ({
  useGetCurrentAxialCodesOfVersion: getCurrentAxialCodes,
}));

describe('useAxialCodeTraceStatus', () => {
  beforeEach(() => getCurrentAxialCodes.mockReset());

  it('resolves linked labels and marks traces updated after axial coding', () => {
    getCurrentAxialCodes.mockReturnValue({
      data: {
        createdAt: '2026-04-01T00:00:00.000Z',
        axialCodes: [
          { label: 'Usability', traceIds: ['trace-1', 'trace-2'] },
          { label: 'Performance', traceIds: ['trace-1'] },
        ],
      },
    });
    const { result } = renderHook(() => useAxialCodeTraceStatus('project-1', 'version-1'));

    expect(result.current({ traceId: 'trace-1', updatedAt: '2026-04-02T00:00:00.000Z' })).toEqual({
      hasAxialCode: true,
      needsUpdate: true,
      labels: ['Usability', 'Performance'],
      reasons: [
        { label: 'Usability', inclusionCriteria: null, quote: null, justification: null },
        { label: 'Performance', inclusionCriteria: null, quote: null, justification: null },
      ],
    });
    expect(result.current({ traceId: 'trace-2', updatedAt: '2026-03-01T00:00:00.000Z' })).toEqual({
      hasAxialCode: true,
      needsUpdate: false,
      labels: ['Usability'],
      reasons: [{ label: 'Usability', inclusionCriteria: null, quote: null, justification: null }],
    });
    expect(result.current({ traceId: 'unlinked', updatedAt: '2026-04-03T00:00:00.000Z' })).toEqual({
      hasAxialCode: false,
      needsUpdate: false,
      labels: [],
      reasons: [],
    });
  });

  it('does not mark a linked trace stale when the generation timestamp is unavailable', () => {
    getCurrentAxialCodes.mockReturnValue({
      data: { axialCodes: [{ label: 'Usability', traceIds: ['trace-1'] }] },
    });
    const { result } = renderHook(() => useAxialCodeTraceStatus('project-1', 'version-1'));

    expect(result.current({ traceId: 'trace-1', updatedAt: '2026-04-02T00:00:00.000Z' })).toEqual({
      hasAxialCode: true,
      needsUpdate: false,
      labels: ['Usability'],
      reasons: [{ label: 'Usability', inclusionCriteria: null, quote: null, justification: null }],
    });
  });

  it('resolves why a trace belongs to each axial code', () => {
    getCurrentAxialCodes.mockReturnValue({
      data: {
        createdAt: '2026-04-01T00:00:00.000Z',
        axialCodes: [
          {
            label: 'Usability',
            inclusionCriteria: 'A trace fits when the user cannot find a feature',
            traceIds: ['trace-1', 'trace-2'],
            traceJustifications: [
              {
                traceId: 'trace-1',
                quote: 'could not find the button',
                justification: 'The user struggled to locate a feature',
              },
            ],
          },
        ],
      },
    });
    const { result } = renderHook(() => useAxialCodeTraceStatus('project-1', 'version-1'));

    expect(
      result.current({ traceId: 'trace-1', updatedAt: '2026-03-01T00:00:00.000Z' }).reasons
    ).toEqual([
      {
        label: 'Usability',
        inclusionCriteria: 'A trace fits when the user cannot find a feature',
        quote: 'could not find the button',
        justification: 'The user struggled to locate a feature',
      },
    ]);
    // A trace in the code without its own justification still gets the inclusion criteria.
    expect(
      result.current({ traceId: 'trace-2', updatedAt: '2026-03-01T00:00:00.000Z' }).reasons
    ).toEqual([
      {
        label: 'Usability',
        inclusionCriteria: 'A trace fits when the user cannot find a feature',
        quote: null,
        justification: null,
      },
    ]);
  });
});
