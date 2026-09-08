import { PromptType } from "@repo/db/generated/prisma/enums";

export interface Tracelist {
  id: string;
  name: string;
  axialCodeFeedback: string;
  createdAt: Date;
  completedAt: Date | null;
  status: {
    positive: number;
    negative: number;
    pending: number;
  };
  traces: PartialTrace[];
}

export type TracelistInfo = Omit<Tracelist, "traces"> & {
  axialCodes: {
    name: string;
    traceAmount: number;
  }[];
};

export interface Trace {
  id: string;
  name: string | null;
  input: string;
  output: string;
  openCode: string | null;
  feedback: ("positive" | "negative") | null;
  isFlagged: boolean;
  context: string | null;
  system: string | null;
  traces?: Trace[];
}

export interface PartialTrace {
  id: string;
  name: string | null;
  feedback: "positive" | "negative" | null;
  isFlagged: boolean;
  hasOpenCode: boolean;
  input_preview: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: Date | string;
  assessmentCriteria: string;
}

export interface Connection {
  id: string;
  traceId: string;
  axialCodeId: string;
  trace: Trace;
  reason: string;
}

export interface AxialCode {
  id: string;
  title: string;
  reason: string;
  description: string;
  feedback: string;
  traceListId: string | null;
  connections: Connection[];
}

export interface MinimalConnection {
  reason: string;
  trace: { id: string; openCode: string | null };
}

export interface OriginalAxialCode {
  title: string;
  description: string;
  reason: string;
  feedback?: string | null;
  connections: MinimalConnection[];
}

export interface PendingAxialCode {
  title: string;
  description: string;
  reason: string;
  traceListId: string;
  connections: { traceId: string; reason: string }[];
}

export type DiffStatus = "added" | "removed" | "modified" | "unchanged";

export type OpenCodeChangeType = "unchanged" | "moved" | "added" | "removed";

export interface OpenCodeMigration {
  traceId: string;
  openCode: string;
  fromAxial: string | null;
  toAxial: string | null;
  changeType: OpenCodeChangeType;
}

export interface ConnectionChangeItem {
  traceId: string;
  openCode: string;
}

export interface AxialConnectionDiff {
  stayed: ConnectionChangeItem[];
  joined: ConnectionChangeItem[];
  left: ConnectionChangeItem[];
}

export interface AxialDiffEntry {
  key: string;
  status: DiffStatus;
  original?: OriginalAxialCode;
  pending?: PendingAxialCode;
  connectionDiff?: AxialConnectionDiff;
}

export interface RegenerateJobMetadata {
  type: "regenerate";
  traceListId: string;
  originalOutput: OriginalAxialCode[];
  pendingOutput: PendingAxialCode[];
  regeneratePrompt?: string;
}

export function asRegenerateMetadata(
  metadata: Record<string, unknown>,
): RegenerateJobMetadata | null {
  if (
    metadata.type === "regenerate" &&
    typeof metadata.traceListId === "string" &&
    Array.isArray(metadata.originalOutput) &&
    Array.isArray(metadata.pendingOutput)
  ) {
    return metadata as unknown as RegenerateJobMetadata;
  }
  return null;
}

export interface Job {
  id: string;
  error: string | null;
  metadata: Record<string, unknown>;
  status: "PROCESSING" | "COMPLETED" | "FAILED";
  createdAt: Date;
  updatedAt: Date;
}

export interface Prompt {
  id: string;
  text: string;
  promptType: PromptType;
}
