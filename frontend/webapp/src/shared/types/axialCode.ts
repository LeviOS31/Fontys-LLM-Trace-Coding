export interface OpenCodeJustification {
  /** Open codes are stored on their trace, so the trace id identifies the open code. */
  traceId: string;
  /** Exact excerpt of the open code that supports the grouping. */
  quote: string;
  /** Why the open code belongs to the axial code. */
  justification: string;
}

export interface AxialCode {
  axialCodeId?: string;
  label: string;
  description: string;
  traceIds: string[];
  /** Guidelines for the judge to decide whether an unseen trace shows this behaviour. Absent for codes generated before they existed. */
  judgeGuidelines?: string | null;
  openCodeJustifications?: OpenCodeJustification[] | null;
  feedback?: string | null;
}
