import type {
  OriginalAxialCode,
  PendingAxialCode,
  DiffStatus,
  OpenCodeChangeType,
  OpenCodeMigration,
  ConnectionChangeItem,
  AxialConnectionDiff,
  AxialDiffEntry,
} from "@/lib/types";

export function buildTraceIdToOpenCode(
  original: OriginalAxialCode[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const axial of original) {
    for (const conn of axial.connections) {
      const label = conn.trace.openCode?.trim();
      if (label) map.set(conn.trace.id, label);
    }
  }
  return map;
}

function getTraceIdsFromOriginal(axial: OriginalAxialCode): Set<string> {
  return new Set(axial.connections.map((c) => c.trace.id));
}

function getTraceIdsFromPending(axial: PendingAxialCode): Set<string> {
  return new Set(axial.connections.map((c) => c.traceId));
}

function intersectionSize(a: Set<string>, b: Set<string>): number {
  let count = 0;
  for (const id of a) {
    if (b.has(id)) count++;
  }
  return count;
}

function buildTraceToAxialTitle(
  originals: OriginalAxialCode[],
  pending: PendingAxialCode[],
): { from: Map<string, string>; to: Map<string, string> } {
  const from = new Map<string, string>();
  const to = new Map<string, string>();

  for (const axial of originals) {
    for (const conn of axial.connections) {
      from.set(conn.trace.id, axial.title);
    }
  }
  for (const axial of pending) {
    for (const conn of axial.connections) {
      to.set(conn.traceId, axial.title);
    }
  }

  return { from, to };
}

export function computeOpenCodeMigrations(
  original: OriginalAxialCode[],
  pending: PendingAxialCode[],
  axialPairingMap?: Map<string, string>,
): OpenCodeMigration[] {
  const openCodeByTraceId = buildTraceIdToOpenCode(original);
  const { from: fromAxial, to: toAxial } = buildTraceToAxialTitle(
    original,
    pending,
  );

  const allTraceIds = new Set<string>([...fromAxial.keys(), ...toAxial.keys()]);

  const migrations: OpenCodeMigration[] = [];

  for (const traceId of allTraceIds) {
    const from = fromAxial.get(traceId) ?? null;
    const toRaw = toAxial.get(traceId) ?? null;
    const to =
      toRaw && axialPairingMap ? (axialPairingMap.get(toRaw) ?? toRaw) : toRaw;
    const openCode =
      openCodeByTraceId.get(traceId) ?? `(trace ${traceId.slice(0, 8)}…)`;

    let changeType: OpenCodeChangeType;
    if (from && to) {
      changeType = from === to ? "unchanged" : "moved";
    } else if (from && !to) {
      changeType = "removed";
    } else {
      changeType = "added";
    }

    migrations.push({
      traceId,
      openCode,
      fromAxial: from,
      toAxial: to,
      changeType,
    });
  }

  const changeOrder: Record<OpenCodeChangeType, number> = {
    moved: 0,
    added: 1,
    removed: 2,
    unchanged: 3,
  };

  migrations.sort((a, b) => {
    const order = changeOrder[a.changeType] - changeOrder[b.changeType];
    if (order !== 0) return order;
    return a.openCode.localeCompare(b.openCode, undefined, {
      sensitivity: "base",
    });
  });

  return migrations;
}

function computeConnectionDiff(
  original: OriginalAxialCode,
  pending: PendingAxialCode,
  openCodeByTraceId: Map<string, string>,
): AxialConnectionDiff {
  const origIds = getTraceIdsFromOriginal(original);
  const pendIds = getTraceIdsFromPending(pending);

  const toItem = (traceId: string): ConnectionChangeItem => ({
    traceId,
    openCode:
      openCodeByTraceId.get(traceId) ?? `(trace ${traceId.slice(0, 8)}…)`,
  });

  const stayed: ConnectionChangeItem[] = [];
  const joined: ConnectionChangeItem[] = [];
  const left: ConnectionChangeItem[] = [];

  for (const id of origIds) {
    if (pendIds.has(id)) stayed.push(toItem(id));
    else left.push(toItem(id));
  }
  for (const id of pendIds) {
    if (!origIds.has(id)) joined.push(toItem(id));
  }

  const sortByLabel = (a: ConnectionChangeItem, b: ConnectionChangeItem) =>
    a.openCode.localeCompare(b.openCode, undefined, { sensitivity: "base" });

  stayed.sort(sortByLabel);
  joined.sort(sortByLabel);
  left.sort(sortByLabel);

  return { stayed, joined, left };
}

function isAxialMetadataUnchanged(
  original: OriginalAxialCode,
  pending: PendingAxialCode,
): boolean {
  return (
    original.title === pending.title &&
    original.description === pending.description &&
    original.reason === pending.reason
  );
}

/** Pair axial codes by shared traces so renames are shown as modifications, not remove+add. */
export function computeAxialDiff(
  original: OriginalAxialCode[],
  pending: PendingAxialCode[],
): AxialDiffEntry[] {
  const openCodeByTraceId = buildTraceIdToOpenCode(original);
  const entries: AxialDiffEntry[] = [];
  const usedPending = new Set<number>();

  const candidates: {
    origIndex: number;
    pendIndex: number;
    overlap: number;
  }[] = [];

  for (let oi = 0; oi < original.length; oi++) {
    const origTraces = getTraceIdsFromOriginal(original[oi]!);
    for (let pi = 0; pi < pending.length; pi++) {
      const pendTraces = getTraceIdsFromPending(pending[pi]!);
      const overlap = intersectionSize(origTraces, pendTraces);
      if (overlap > 0) {
        candidates.push({ origIndex: oi, pendIndex: pi, overlap });
      }
    }
  }

  candidates.sort((a, b) => b.overlap - a.overlap);

  const matchedOrig = new Set<number>();
  const matchedPend = new Set<number>();

  for (const { origIndex, pendIndex, overlap } of candidates) {
    if (matchedOrig.has(origIndex) || matchedPend.has(pendIndex)) continue;
    matchedOrig.add(origIndex);
    matchedPend.add(pendIndex);
    usedPending.add(pendIndex);

    const orig = original[origIndex]!;
    const pend = pending[pendIndex]!;
    const connectionDiff = computeConnectionDiff(orig, pend, openCodeByTraceId);
    const hasConnectionChanges =
      connectionDiff.joined.length > 0 || connectionDiff.left.length > 0;
    const metadataUnchanged = isAxialMetadataUnchanged(orig, pend);

    const status: DiffStatus =
      metadataUnchanged && !hasConnectionChanges ? "unchanged" : "modified";

    entries.push({
      key: `pair-${origIndex}-${pendIndex}`,
      status,
      original: orig,
      pending: pend,
      connectionDiff,
    });
  }

  for (let oi = 0; oi < original.length; oi++) {
    if (matchedOrig.has(oi)) continue;
    const orig = original[oi]!;
    entries.push({
      key: `removed-${oi}`,
      status: "removed",
      original: orig,
      connectionDiff: {
        stayed: [],
        joined: [],
        left: orig.connections.map((c) => ({
          traceId: c.trace.id,
          openCode:
            c.trace.openCode?.trim() ?? `(trace ${c.trace.id.slice(0, 8)}…)`,
        })),
      },
    });
  }

  for (let pi = 0; pi < pending.length; pi++) {
    if (matchedPend.has(pi)) continue;
    const pend = pending[pi]!;
    entries.push({
      key: `added-${pi}`,
      status: "added",
      pending: pend,
      connectionDiff: {
        stayed: [],
        left: [],
        joined: pend.connections.map((c) => ({
          traceId: c.traceId,
          openCode:
            openCodeByTraceId.get(c.traceId) ??
            `(trace ${c.traceId.slice(0, 8)}…)`,
        })),
      },
    });
  }

  const statusOrder: Record<DiffStatus, number> = {
    modified: 0,
    removed: 1,
    added: 2,
    unchanged: 3,
  };

  entries.sort((a, b) => {
    const order = statusOrder[a.status] - statusOrder[b.status];
    if (order !== 0) return order;
    const titleA = a.pending?.title ?? a.original?.title ?? "";
    const titleB = b.pending?.title ?? b.original?.title ?? "";
    return titleA.localeCompare(titleB, undefined, { sensitivity: "base" });
  });

  return entries;
}

export function countMigrations(migrations: OpenCodeMigration[]) {
  return {
    unchanged: migrations.filter((m) => m.changeType === "unchanged").length,
    moved: migrations.filter((m) => m.changeType === "moved").length,
    added: migrations.filter((m) => m.changeType === "added").length,
    removed: migrations.filter((m) => m.changeType === "removed").length,
  };
}
