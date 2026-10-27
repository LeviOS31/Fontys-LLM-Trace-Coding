export type JudgeTemplate = {
  id: string;
  axialCodeId: string;
  name: string;
  isDeprecated: boolean;
};

// verdict and reasoning are null when the trace failed.
export type JudgeResult = {
  traceId: string;
  status: string;
  verdict: string | null;
  reasoning: string | null;
  error: string | null;
};

// Response of the POST that runs the judge.
export type JudgeResponse = { judgeRunId: string; results: JudgeResult[] };

// One row of the paged run list. The counts are computed by the backend.
export type JudgeRunSummary = {
  judgeRunId: string;
  axialCodeId: string;
  createdAt: string;
  totalCount: number;
  trueCount: number;
  falseCount: number;
  failedCount: number;
};

// A list row plus the template name, which is resolved on the client.
export type JudgeRunListItem = JudgeRunSummary & { templateName: string };

export type JudgeRunTotals = {
  runs: number;
  totalCount: number;
  trueCount: number;
  falseCount: number;
  failedCount: number;
};

export type RunError = { message: string; raw: string };

export const isJudgeResponse = (value: unknown): value is JudgeResponse => {
  const obj = value as JudgeResponse | null;
  return !!obj && typeof obj === 'object' && Array.isArray(obj.results);
};

export const isOk = (r: JudgeResult) => r.status.toLowerCase() === 'success';
export const isTrue = (r: JudgeResult) => isOk(r) && r.verdict?.toLowerCase() === 'true';

export type JudgeStats = {
  total: number;
  trueCount: number;
  falseCount: number;
  failedCount: number;
  trueRate: number | null;
  falseRate: number | null;
};

export function statsFromCounts(c: {
  totalCount: number;
  trueCount: number;
  falseCount: number;
  failedCount: number;
}): JudgeStats {
  const total = c.totalCount;
  return {
    total,
    trueCount: c.trueCount,
    falseCount: c.falseCount,
    failedCount: c.failedCount,
    trueRate: total === 0 ? null : c.trueCount / total,
    falseRate: total === 0 ? null : c.falseCount / total,
  };
}

export const formatPercent = (value: number | null) =>
  value === null ? '–' : `${(value * 100).toFixed(1)}%`;

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
