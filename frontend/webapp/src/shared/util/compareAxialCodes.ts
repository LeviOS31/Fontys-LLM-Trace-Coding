import type { AxialCode } from '../types/axialCode.ts';

export type AxialCodeChangeKind = 'unchanged' | 'renamed' | 'changed' | 'new' | 'merged' | 'split';

/**
 * Share of a code's open codes that has to end up in a single code of the other
 * version for the two to count as the same code. Codes are matched on their open
 * codes rather than on their label, because the LLM often renames a code that
 * still groups the same open codes.
 */
export const MATCH_SHARE = 0.5;

export interface AxialCodeChange {
  readonly code: AxialCode;
  readonly kind: AxialCodeChangeKind;
  /** The old codes this code comes from; empty for a new code. */
  readonly previous: readonly AxialCode[];
  /** Open codes (trace ids) this code gained compared to `previous`. */
  readonly addedTraceIds: readonly string[];
  /** Open codes (trace ids) this code lost compared to `previous`. */
  readonly removedTraceIds: readonly string[];
}

export interface MovedOpenCode {
  readonly traceId: string;
  readonly from: AxialCode;
  readonly to: AxialCode;
}

export interface AxialCodeComparison {
  /** One entry per new code, in the order of `next`. */
  readonly changes: readonly AxialCodeChange[];
  /** Old codes that have no counterpart in the new version. */
  readonly removed: readonly AxialCode[];
  /** Open codes that ended up in a code that does not descend from their old code. */
  readonly moved: readonly MovedOpenCode[];
  readonly counts: Readonly<Record<AxialCodeChangeKind | 'removed', number>>;
}

function normalizeLabel(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, ' ');
}

function hasSameLabel(a: AxialCode, b: AxialCode): boolean {
  return normalizeLabel(a.label) === normalizeLabel(b.label);
}

function countShared(ids: ReadonlySet<string>, code: AxialCode): number {
  return new Set(code.traceIds.filter((id) => ids.has(id))).size;
}

/**
 * The candidate that holds most of `code`'s open codes, as long as it holds at
 * least MATCH_SHARE of them. Ties go to the candidate with the same label; a code
 * without open codes can only be matched on its label.
 */
function findCounterpart(code: AxialCode, candidates: readonly AxialCode[]): AxialCode | undefined {
  const ids = new Set(code.traceIds);
  if (ids.size === 0) return candidates.find((candidate) => hasSameLabel(code, candidate));

  let best: AxialCode | undefined;
  let bestShared = 0;
  for (const candidate of candidates) {
    const shared = countShared(ids, candidate);
    const isBetter =
      shared > bestShared ||
      (shared === bestShared &&
        shared > 0 &&
        best !== undefined &&
        hasSameLabel(code, candidate) &&
        !hasSameLabel(code, best));
    if (isBetter) {
      best = candidate;
      bestShared = shared;
    }
  }

  return best && bestShared / ids.size >= MATCH_SHARE ? best : undefined;
}

function difference(ids: readonly string[], other: ReadonlySet<string>): string[] {
  return [...new Set(ids)].filter((id) => !other.has(id));
}

/**
 * Compares an approved set of axial codes (`previous`) with a regenerated one
 * (`next`) and describes, for every new code, what happened to it.
 */
export function compareAxialCodes(
  previous: readonly AxialCode[],
  next: readonly AxialCode[]
): AxialCodeComparison {
  // Where most of each old code went, and where most of each new code came from.
  const destinationOf = new Map(previous.map((code) => [code, findCounterpart(code, next)]));
  const sourceOf = new Map(next.map((code) => [code, findCounterpart(code, previous)]));

  const comesFrom = (newCode: AxialCode, oldCode: AxialCode) =>
    destinationOf.get(oldCode) === newCode || sourceOf.get(newCode) === oldCode;

  const changes = next.map((code): AxialCodeChange => {
    const ids = new Set(code.traceIds);
    const mergedFrom = previous.filter((oldCode) => destinationOf.get(oldCode) === code);

    if (mergedFrom.length >= 2) {
      const previousIds = new Set(mergedFrom.flatMap((oldCode) => oldCode.traceIds));
      return {
        code,
        kind: 'merged',
        previous: mergedFrom,
        addedTraceIds: difference(code.traceIds, previousIds),
        removedTraceIds: difference([...previousIds], ids),
      };
    }

    const origin = mergedFrom[0] ?? sourceOf.get(code);
    if (!origin) {
      return {
        code,
        kind: 'new',
        previous: [],
        addedTraceIds: [...ids],
        removedTraceIds: [],
      };
    }

    const originIds = new Set(origin.traceIds);
    const pieces = next.filter((newCode) => comesFrom(newCode, origin));
    if (pieces.length >= 2) {
      // The other pieces hold what this code "lost", so only the additions are shown.
      return {
        code,
        kind: 'split',
        previous: [origin],
        addedTraceIds: difference(code.traceIds, originIds),
        removedTraceIds: [],
      };
    }

    const addedTraceIds = difference(code.traceIds, originIds);
    const removedTraceIds = difference(origin.traceIds, ids);
    const sameOpenCodes = addedTraceIds.length === 0 && removedTraceIds.length === 0;

    let kind: AxialCodeChangeKind = 'renamed';
    if (hasSameLabel(code, origin)) kind = sameOpenCodes ? 'unchanged' : 'changed';

    return { code, kind, previous: [origin], addedTraceIds, removedTraceIds };
  });

  const removed = previous.filter(
    (oldCode) => !next.some((newCode) => comesFrom(newCode, oldCode))
  );

  const moved: MovedOpenCode[] = [];
  const seen = new Set<string>();
  for (const oldCode of previous) {
    for (const traceId of oldCode.traceIds) {
      if (seen.has(traceId)) continue;
      seen.add(traceId);

      const newCode = next.find((code) => code.traceIds.includes(traceId));
      if (newCode && !comesFrom(newCode, oldCode)) {
        moved.push({ traceId, from: oldCode, to: newCode });
      }
    }
  }

  const counts: Record<AxialCodeChangeKind | 'removed', number> = {
    unchanged: 0,
    renamed: 0,
    changed: 0,
    new: 0,
    merged: 0,
    split: 0,
    removed: removed.length,
  };
  for (const change of changes) counts[change.kind] += 1;

  return { changes, removed, moved, counts };
}
