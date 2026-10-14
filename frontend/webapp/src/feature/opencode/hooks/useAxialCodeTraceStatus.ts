import { useMemo } from 'react';
import { useGetCurrentAxialCodesOfVersion } from '../../axialcode/hooks/useGetCurrentAxialCodesOfVersion';
import type { TraceDetailView } from '../../../shared/types/trace';

/** Why a trace belongs to one axial code. */
export interface AxialCodeTraceReason {
  label: string;
  /** When a trace belongs to the axial code. */
  inclusionCriteria: string | null;
  /** Excerpt of the trace's open code that supports the categorisation. */
  quote: string | null;
  /** Why this trace fits the axial code. */
  justification: string | null;
}

export interface TraceAxialCodeStatus {
  /** The trace is referenced by at least one axial code. */
  hasAxialCode: boolean;
  /** The trace was open-coded after the axial codes were generated, so they may be stale. */
  needsUpdate: boolean;
  /** Labels of the axial codes that reference this trace. */
  labels: string[];
  /** Per axial code, why this trace belongs to it. Fields are null for codes generated before justifications existed. */
  reasons: AxialCodeTraceReason[];
}

const NO_AXIAL_CODE: TraceAxialCodeStatus = {
  hasAxialCode: false,
  needsUpdate: false,
  labels: [],
  reasons: [],
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

    const reasonsByTrace = new Map<string, AxialCodeTraceReason[]>();
    for (const axialCode of data?.axialCodes ?? []) {
      for (const traceId of axialCode.traceIds) {
        const justification = axialCode.traceJustifications?.find((j) => j.traceId === traceId);
        const reason: AxialCodeTraceReason = {
          label: axialCode.label,
          inclusionCriteria: axialCode.inclusionCriteria ?? null,
          quote: justification?.quote ?? null,
          justification: justification?.justification ?? null,
        };
        const reasons = reasonsByTrace.get(traceId);
        if (reasons) reasons.push(reason);
        else reasonsByTrace.set(traceId, [reason]);
      }
    }

    return (trace: TraceLike): TraceAxialCodeStatus => {
      const reasons = reasonsByTrace.get(trace.traceId);
      if (!reasons) return NO_AXIAL_CODE;

      const needsUpdate = generatedAt !== null && new Date(trace.updatedAt).getTime() > generatedAt;

      return {
        hasAxialCode: true,
        needsUpdate,
        labels: reasons.map((reason) => reason.label),
        reasons,
      };
    };
  }, [data]);
}
