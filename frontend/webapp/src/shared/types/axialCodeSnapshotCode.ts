import type { AxialCodeChangeKind } from '../util/compareAxialCodes.ts';

export interface AxialCodeSnapshotCode {
  readonly id: string;
  readonly name: string;
  readonly description: string;
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
