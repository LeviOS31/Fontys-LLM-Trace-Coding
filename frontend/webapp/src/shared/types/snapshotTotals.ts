export interface SnapshotTotals {
  readonly axialCodes: number;
  readonly traces: number;
  readonly openCodes: number;
  readonly avgTracesPerCode: number;
  readonly avgOpenCodesPerCode: number;
  readonly largestCategory: string;
}
