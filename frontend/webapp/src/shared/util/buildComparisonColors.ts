import type { AxialCode } from '../types/axialCode.ts';
import buildColors from './buildColors.ts';
import type { AxialCodeComparison } from './compareAxialCodes.ts';

const bySize = (a: AxialCode, b: AxialCode) => b.traceIds.length - a.traceIds.length;

/**
 * Colors for both versions of a comparison, so a code keeps its color when it
 * is regenerated. Every approved code gets a color as usual (largest code first);
 * a regenerated code takes the color of the largest code it comes from. New codes,
 * and the extra pieces of a split, get the colors no approved code uses.
 */
export default function buildComparisonColors(
  previous: readonly AxialCode[],
  comparison: AxialCodeComparison
): Map<AxialCode, string> {
  const sortedPrevious = [...previous].sort(bySize);
  const sortedChanges = [...comparison.changes].sort((a, b) => bySize(a.code, b.code));

  const inheritedFrom = new Map<AxialCode, AxialCode>();
  const taken = new Set<AxialCode>();
  for (const change of sortedChanges) {
    const origin = [...change.previous].sort(bySize)[0];
    if (origin && !taken.has(origin)) {
      inheritedFrom.set(change.code, origin);
      taken.add(origin);
    }
  }

  const withoutColor = sortedChanges
    .map((change) => change.code)
    .filter((code) => !inheritedFrom.has(code));
  const palette = buildColors(sortedPrevious.length + withoutColor.length);

  const colors = new Map<AxialCode, string>();
  sortedPrevious.forEach((code, index) => colors.set(code, palette[index]));
  for (const [code, origin] of inheritedFrom) colors.set(code, colors.get(origin)!);
  withoutColor.forEach((code, index) => colors.set(code, palette[sortedPrevious.length + index]));

  return colors;
}
