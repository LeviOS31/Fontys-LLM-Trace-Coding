export interface ComparisonSignal {
  readonly label: string;
  readonly a: number | string;
  readonly b: number | string;
  readonly delta: string;
  readonly positive?: boolean;
}
