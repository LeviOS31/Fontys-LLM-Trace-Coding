import type { AxialCodeChangeKind } from '../util/compareAxialCodes.ts';

/** Why a single trace was placed in an axial code. */
export interface AxialCodeSnapshotJustification {
  readonly traceId: string;
  /** The trace's full open code, when known. */
  readonly openCode?: string;
  readonly quote: string;
  readonly justification: string;
}

export interface AxialCodeSnapshotCode {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  /** When a trace belongs to this code. */
  readonly inclusionCriteria?: string | null;
  /** Why each trace belongs to this code. */
  readonly justifications?: readonly AxialCodeSnapshotJustification[];
  readonly prevalence: number;
  readonly traceCount: number;
  readonly openCodeCount: number;
  readonly traceIds: readonly string[];
  readonly sampleTraces: readonly string[];
  readonly sampleOpenCodes: readonly string[];
  readonly color: string;
  /** Labels of the approved codes this regenerated code comes from. */
  readonly derivedFrom?: readonly string[];
  readonly changeKind?: AxialCodeChangeKind;
  readonly addedTraceIds?: readonly string[];
  readonly removedTraceIds?: readonly string[];
}
