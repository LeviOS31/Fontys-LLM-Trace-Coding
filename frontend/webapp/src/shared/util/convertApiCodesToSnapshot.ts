import type { AxialCode as ApiAxialCode } from '../types/axialCode.ts';
import type { AxialCodeSnapshotCode } from '../types/axialCodeSnapshotCode.ts';
import type { Snapshot } from '../types/snapshot.ts';
import type { SnapshotTotals } from '../types/snapshotTotals.ts';
import buildColors from './buildColors.ts';

export function convertApiCodesToSnapshot(
  apiCodes: ApiAxialCode[],
  label: string,
  generatedAt: string,
  openCodeTextById: Readonly<Record<string, string>>
): Snapshot {
  if (apiCodes.length === 0) {
    return {
      label,
      generatedAt,
      totals: {
        axialCodes: 0,
        traces: 0,
        openCodes: 0,
        avgTracesPerCode: 0,
        avgOpenCodesPerCode: 0,
        largestCategory: '',
      },
      codes: [],
    };
  }

  const sorted = [...apiCodes].sort((a, b) => b.traceIds.length - a.traceIds.length);
  const totalOpenCodes = sorted.reduce((sum, c) => sum + c.traceIds.length, 0);
  const palette = buildColors(sorted.length);

  const codes: AxialCodeSnapshotCode[] = sorted.map((apiCode, i) => {
    const openCodeCount = apiCode.traceIds.length;
    const prevalence =
      totalOpenCodes > 0 ? Math.round((openCodeCount / totalOpenCodes) * 1000) / 10 : 0;

    return {
      id: `code_${i}_${label}`,
      name: apiCode.label,
      description: apiCode.description,
      prevalence,
      traceCount: openCodeCount,
      openCodeCount,
      traceIds: apiCode.traceIds,
      sampleTraces: [],
      sampleOpenCodes: apiCode.traceIds
        .map((id) => openCodeTextById[id])
        .filter((text): text is string => Boolean(text)),
      color: palette[i],
    };
  });

  const totals: SnapshotTotals = {
    axialCodes: codes.length,
    traces: totalOpenCodes,
    openCodes: totalOpenCodes,
    avgTracesPerCode: codes.length > 0 ? Math.round(totalOpenCodes / codes.length) : 0,
    avgOpenCodesPerCode: codes.length > 0 ? Math.round(totalOpenCodes / codes.length) : 0,
    largestCategory: codes[0]?.name ?? '',
  };

  return {
    label,
    generatedAt,
    totals,
    codes,
  };
}
