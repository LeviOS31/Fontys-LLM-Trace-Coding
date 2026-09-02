import type { AxialCodeSnapshotCode } from './axialCodeSnapshotCode.ts';
import type { SnapshotTotals } from './snapshotTotals.ts';

export interface Snapshot {
  readonly label: string;
  readonly generatedAt: string;
  readonly feedbackNote?: string;
  readonly totals: SnapshotTotals;
  readonly codes: readonly AxialCodeSnapshotCode[];
}
