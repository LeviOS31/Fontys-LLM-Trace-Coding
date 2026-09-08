import { useMemo } from 'react';
import { useGetCurrentAxialCodesOfVersion } from '../../axialcode/hooks/useGetCurrentAxialCodesOfVersion';
import type { TraceDetailView } from '../../../shared/types/trace';

export interface TraceAxialCodeStatus {
  /** The trace is referenced by at least one axial code. */
  hasAxialCode: boolean;
  /** The trace was open-coded after the axial codes were generated, so they may be stale. */
  needsUpdate: boolean;
  /** Labels of the axial codes that reference this trace. */
  labels: string[];
}

const NO_AXIAL_CODE: TraceAxialCodeStatus = {
  hasAxialCode: false,
  needsUpdate: false,
  labels: [],
};

type TraceLike = Pick<TraceDetailView, 'traceId' | 'updatedAt'>;

/**
 * Resolves, for any trace in the version, whether it belongs to an axial code and
 * whether that axial coding is outdated relative to the trace's latest open-code edit.
 *
 * The current axial coding result is fetched once (and cached by React Query); the
 * returned resolver is a pure, memoised lookup so callers can classify many traces cheaply.
 */
export function useAxialCodeTraceStatus(projectId: string, versionId: string) {
  const { data } = useGetCurrentAxialCodesOfVersion(projectId, versionId);

  return useMemo(() => {
    const generatedAt = data?.createdAt ? new Date(data.createdAt).getTime() : null;

    const labelsByTrace = new Map<string, string[]>();
    for (const axialCode of data?.axialCodes ?? []) {
      for (const traceId of axialCode.traceIds) {
        const labels = labelsByTrace.get(traceId);
        if (labels) labels.push(axialCode.label);
        else labelsByTrace.set(traceId, [axialCode.label]);
      }
    }

    return (trace: TraceLike): TraceAxialCodeStatus => {
      const labels = labelsByTrace.get(trace.traceId);
      if (!labels) return NO_AXIAL_CODE;

      const needsUpdate = generatedAt !== null && new Date(trace.updatedAt).getTime() > generatedAt;

      return { hasAxialCode: true, needsUpdate, labels };
    };
  }, [data]);
}
