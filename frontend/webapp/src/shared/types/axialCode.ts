export interface TraceJustification {
  traceId: string;
  /** Exact excerpt of the trace's open code that supports the categorisation. */
  quote: string;
  /** Why the trace fits the axial code. */
  justification: string;
}

export interface AxialCode {
  axialCodeId?: string;
  label: string;
  description: string;
  traceIds: string[];
  /** When a trace belongs to this axial code. Absent for codes generated before justifications existed. */
  inclusionCriteria?: string | null;
  traceJustifications?: TraceJustification[] | null;
  feedback?: string | null;
}
