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
  /** Why this code was created. Absent for codes generated before it existed. */
  rationale?: string | null;
  /**
   * Instructions for judging an unseen trace. Never shown to the user, but it must stay on this
   * type: regeneration sends the previous codes back to the backend, which passes it to the model.
   * Absent for codes generated before it existed.
   */
  judgeGuidelines?: string | null;
  /** Real trace excerpt that fits this code ("User: ...\nAssistant: ..."). */
  positiveExampleTrace?: string | null;
  positiveExampleReasoning?: string | null;
  /** Real trace excerpt that does not fit this code. Null when none could be found. */
  negativeExampleTrace?: string | null;
  negativeExampleReasoning?: string | null;
  openCodeJustifications?: OpenCodeJustification[] | null;
  feedback?: string | null;
}
