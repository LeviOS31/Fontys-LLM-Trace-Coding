export type JudgeTemplate = {
  id: string;
  axialCodeId: string;
  name: string;
  isDeprecated: boolean;
};

export type JudgeResult = {
  traceId: string;
  status: string;
  verdict: string;
  reasoning: string;
  error: string | null;
};

export type JudgeResponse = { judgeRunId: string; results: JudgeResult[] };

// A judge run as kept in the page state. The backend does not store runs,
// so everything beyond the API response is added on the client.
export type JudgeRun = JudgeResponse & {
  axialCodeId: string;
  templateName: string;
  createdAt: string;
};

export type RunError = { message: string; raw: string };

export const isJudgeResponse = (value: unknown): value is JudgeResponse => {
  const obj = value as JudgeResponse | null;
  return !!obj && typeof obj === 'object' && Array.isArray(obj.results);
};

export const isTrue = (r: JudgeResult) => String(r.verdict).toLowerCase() === 'true';
export const isOk = (r: JudgeResult) => String(r.status).toLowerCase() === 'success';

export function summarize(results: JudgeResult[]) {
  const total = results.length;
  const trueCount = results.filter(isTrue).length;
  return {
    total,
    trueCount,
    falseCount: total - trueCount,
    failedCount: results.filter((r) => !isOk(r)).length,
    trueRate: total === 0 ? null : trueCount / total,
    falseRate: total === 0 ? null : (total - trueCount) / total,
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
