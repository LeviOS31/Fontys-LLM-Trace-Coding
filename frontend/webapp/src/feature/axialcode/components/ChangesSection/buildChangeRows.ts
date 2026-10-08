import type { AxialCode } from '../../../../shared/types/axialCode.ts';
import type {
  AxialCodeChange,
  AxialCodeComparison,
} from '../../../../shared/util/compareAxialCodes.ts';

export type ChangeRow =
  /** One approved code divided over several regenerated codes. */
  | { readonly kind: 'split'; readonly from: AxialCode; readonly to: readonly AxialCodeChange[] }
  /** Several approved codes joined into one regenerated code. */
  | { readonly kind: 'merged'; readonly from: readonly AxialCode[]; readonly to: AxialCodeChange }
  | {
      readonly kind: 'renamed' | 'changed' | 'new' | 'unchanged';
      readonly from: AxialCode | undefined;
      readonly to: AxialCodeChange;
    }
  /** An approved code without counterpart in the regenerated version. */
  | { readonly kind: 'removed'; readonly from: AxialCode };

// The order in which the kinds of change are listed, most significant first.
const ORDER: readonly ChangeRow['kind'][] = [
  'split',
  'merged',
  'renamed',
  'changed',
  'new',
  'removed',
  'unchanged',
];

/**
 * Turns a comparison into the rows of the changes section: one row per change,
 * where the pieces of a split are grouped under the code they come from.
 */
export function buildChangeRows(comparison: AxialCodeComparison): ChangeRow[] {
  const rows: ChangeRow[] = [];
  const splitRows = new Map<AxialCode, AxialCodeChange[]>();

  for (const change of comparison.changes) {
    if (change.kind === 'split') {
      const origin = change.previous[0];
      const pieces = splitRows.get(origin) ?? [];
      if (pieces.length === 0) splitRows.set(origin, pieces);
      pieces.push(change);
    } else if (change.kind === 'merged') {
      rows.push({ kind: 'merged', from: change.previous, to: change });
    } else {
      rows.push({ kind: change.kind, from: change.previous[0], to: change });
    }
  }

  for (const [from, to] of splitRows) rows.push({ kind: 'split', from, to });
  for (const from of comparison.removed) rows.push({ kind: 'removed', from });

  return rows.sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind));
}

/** The version A codes of a row. */
export function sourcesOf(row: ChangeRow): readonly AxialCode[] {
  switch (row.kind) {
    case 'merged':
      return row.from;
    case 'split':
    case 'removed':
      return [row.from];
    default:
      return row.from ? [row.from] : [];
  }
}

/** The version B codes of a row. */
export function targetsOf(row: ChangeRow): readonly AxialCodeChange[] {
  switch (row.kind) {
    case 'removed':
      return [];
    case 'split':
      return row.to;
    default:
      return [row.to];
  }
}
