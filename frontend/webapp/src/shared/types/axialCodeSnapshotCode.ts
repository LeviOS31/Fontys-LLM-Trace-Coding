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
  readonly derivedFrom?: readonly string[];
  readonly changeKind?: 'new' | 'split' | 'renamed' | 'stable';
}
