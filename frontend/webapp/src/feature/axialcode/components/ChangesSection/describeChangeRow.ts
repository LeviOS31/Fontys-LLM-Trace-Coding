import type { AxialCode } from '../../../../shared/types/axialCode.ts';
import { sourcesOf, targetsOf, type ChangeRow } from './buildChangeRows.ts';

/** An open code, with the code of the other version it relates to when that matters. */
export interface OpenCodeRef {
  readonly traceId: string;
  /** Where an added open code came from, or where a leaving open code went to. */
  readonly other?: AxialCode;
}

/** The open codes of one version B code of a row. */
export interface TargetGroup {
  readonly target: AxialCode;
  /** Open codes the code already had in version A. */
  readonly kept: readonly OpenCodeRef[];
  /** Open codes that joined the code. */
  readonly added: readonly OpenCodeRef[];
}

export interface ChangeRowDetails {
  /** One sentence that explains the change. */
  readonly summary: string;
  readonly groups: readonly TargetGroup[];
  /** Open codes of the version A codes that ended up outside this row. */
  readonly left: readonly OpenCodeRef[];
  readonly description?: { readonly before: string; readonly after: string };
}

const openCodes = (count: number) => `${count} open code${count === 1 ? '' : 's'}`;
const quote = (code: AxialCode) => `"${code.label}"`;

function listLabels(codes: readonly AxialCode[]): string {
  const labels = codes.map(quote);
  return labels.length <= 1
    ? labels.join('')
    : `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
}

/** The first code of `codes` that groups the open code, if any. */
function codeOf(traceId: string, codes: readonly AxialCode[]): AxialCode | undefined {
  return codes.find((code) => code.traceIds.includes(traceId));
}

/**
 * Works out which open codes a change kept, gained and lost, and where the moved
 * ones came from or went to, so the changes section can show the change itself
 * instead of only its kind.
 */
export function describeChangeRow(
  row: ChangeRow,
  previous: readonly AxialCode[],
  next: readonly AxialCode[]
): ChangeRowDetails {
  const sources = sourcesOf(row);
  const targets = targetsOf(row).map((change) => change.code);
  const sourceIds = new Set(sources.flatMap((code) => code.traceIds));
  const targetIds = new Set(targets.flatMap((code) => code.traceIds));

  const groups = targets.map((target): TargetGroup => {
    const ids = [...new Set(target.traceIds)];
    return {
      target,
      // With several sources (a merge) it helps to know which one each open code came from.
      kept: ids
        .filter((id) => sourceIds.has(id))
        .map((traceId) => ({
          traceId,
          other: sources.length > 1 ? codeOf(traceId, sources) : undefined,
        })),
      added: ids
        .filter((id) => !sourceIds.has(id))
        .map((traceId) => ({ traceId, other: codeOf(traceId, previous) })),
    };
  });

  const left = [...sourceIds]
    .filter((id) => !targetIds.has(id))
    .map((traceId) => ({ traceId, other: codeOf(traceId, next) }));

  const source = sources[0];
  const target = targets[0];
  const keptCount = groups.reduce((sum, group) => sum + group.kept.length, 0);
  const addedCount = groups.reduce((sum, group) => sum + group.added.length, 0);

  let summary: string;
  switch (row.kind) {
    case 'unchanged':
      summary = `Nothing changed: same name and the same ${openCodes(sourceIds.size)}.`;
      break;
    case 'renamed':
      summary = `${quote(source)} was renamed to ${quote(target)}. It keeps ${keptCount} of its ${openCodes(sourceIds.size)}.`;
      break;
    case 'changed': {
      const moves = [
        addedCount > 0 ? `${openCodes(addedCount)} joined it` : '',
        left.length > 0 ? `${openCodes(left.length)} left it` : '',
      ].filter(Boolean);
      summary = `${quote(target)} kept its name; ${moves.join(' and ')}.`;
      break;
    }
    case 'split':
      summary = `${quote(source)} was split into ${targets.length} codes.`;
      break;
    case 'merged':
      summary = `${listLabels(sources)} were merged into ${quote(target)}.`;
      break;
    case 'new':
      summary = `${quote(target)} is a new code with ${openCodes(targetIds.size)}.`;
      break;
    case 'removed':
      summary = `${quote(source)} no longer exists. Its ${openCodes(sourceIds.size)} went elsewhere.`;
      break;
  }

  const hasNewDescription =
    source !== undefined &&
    target !== undefined &&
    targets.length === 1 &&
    sources.length === 1 &&
    source.description.trim() !== target.description.trim();

  return {
    summary,
    groups,
    left,
    description: hasNewDescription
      ? { before: source.description, after: target.description }
      : undefined,
  };
}
