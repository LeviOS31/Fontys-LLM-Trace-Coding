import type { ComparisonSignal } from './comparisonSignal.ts';

export interface ComparisonSummary {
  readonly headline: string;
  readonly body: string;
  readonly signals: readonly ComparisonSignal[];
}
