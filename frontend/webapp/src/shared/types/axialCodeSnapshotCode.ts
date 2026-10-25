import type { AxialCodeChangeKind } from '../util/compareAxialCodes.ts';

/** Why a single open code belongs to an axial code. */
export interface AxialCodeSnapshotJustification {
  readonly traceId: string;
  readonly quote: string;
  readonly justification: string;
}

export interface AxialCodeSnapshotCode {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  /** Guidelines for the judge to decide whether an unseen trace shows this behaviour. */
  readonly judgeGuidelines?: string | null;
  /** Why each grouped open code belongs to this code. */
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
