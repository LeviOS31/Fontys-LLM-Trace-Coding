import type { AxialCodeChangeKind } from '../util/compareAxialCodes.ts';

export interface AxialCodeSnapshotJustification {
  readonly traceId: string;
  readonly quote: string;
  readonly justification: string;
}

export interface AxialCodeSnapshotExample {
  readonly trace: string;
  readonly reasoning: string;
}

export interface AxialCodeSnapshotCode {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly rationale?: string | null;
  readonly justifications?: readonly AxialCodeSnapshotJustification[];
  readonly positiveExample?: AxialCodeSnapshotExample | null;
  readonly negativeExample?: AxialCodeSnapshotExample | null;
  readonly prevalence: number;
  readonly traceCount: number;
  readonly openCodeCount: number;
  readonly traceIds: readonly string[];
  readonly sampleTraces: readonly string[];
  readonly sampleOpenCodes: readonly string[];
  readonly color: string;
  readonly derivedFrom?: readonly string[];
  readonly changeKind?: AxialCodeChangeKind;
  readonly addedTraceIds?: readonly string[];
  readonly removedTraceIds?: readonly string[];
}
