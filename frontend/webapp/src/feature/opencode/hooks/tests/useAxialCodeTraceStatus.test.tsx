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
    });
    expect(result.current({ traceId: 'trace-2', updatedAt: '2026-03-01T00:00:00.000Z' })).toEqual({
      hasAxialCode: true,
      needsUpdate: false,
      labels: ['Usability'],
    });
    expect(result.current({ traceId: 'unlinked', updatedAt: '2026-04-03T00:00:00.000Z' })).toEqual({
      hasAxialCode: false,
      needsUpdate: false,
      labels: [],
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
    });
  });
});
