import type { AxialCodeItem } from '../types/statistics.dto.ts';
import type { Snapshot } from '../types/snapshot.ts';
import buildColors from './buildColors.ts';

export function axialCodesToSnapshot(
  codes: AxialCodeItem[],
  label: string,
  totalTraceCount: number,
  totalOpenCodeCount: number
): Snapshot {
  const totalOpenCodes = codes.reduce((sum, c) => sum + c.openCodeCount, 0);
  const palette = buildColors(codes.length);
  const largest = codes.reduce(
    (max, c) => (c.openCodeCount > (max?.openCodeCount ?? 0) ? c : max),
    codes[0]
  );

  return {
    label,
    generatedAt: 'Live data',
    totals: {
      axialCodes: codes.length,
      traces: totalTraceCount,
      openCodes: totalOpenCodeCount,
      avgTracesPerCode: codes.length > 0 ? Math.round(totalTraceCount / codes.length) : 0,
      avgOpenCodesPerCode: codes.length > 0 ? Math.round(totalOpenCodeCount / codes.length) : 0,
      largestCategory: largest?.label ?? '',
    },
    codes: codes.map((code, i) => ({
      id: code.label,
      name: code.label,
      description: code.description,
      prevalence:
        totalOpenCodes > 0 ? Math.round((code.openCodeCount / totalOpenCodes) * 1000) / 10 : 0,
      traceCount: 0,
      openCodeCount: code.openCodeCount,
      traceIds: [],
      sampleTraces: [],
      sampleOpenCodes: [],
      color: palette[i],
    })),
  };
}
