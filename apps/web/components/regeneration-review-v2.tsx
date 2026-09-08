"use client";

import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Minus, Plus } from "lucide-react";
import {
  acceptRegeneration,
  getAxialCodes,
  rejectRegeneration,
} from "@/app/[projectId]/[traceListId]/axial-codes/actions";
import {
  buildTraceIdToOpenCode,
  computeAxialDiff,
  computeOpenCodeMigrations,
} from "@/lib/axial-regeneration-diff";
import {
  type Job,
  type OpenCodeChangeType,
  type OpenCodeMigration,
  type OriginalAxialCode,
  type PendingAxialCode,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { AxialReviewCard } from "@/components/axial-review-card";
import { useJobStore } from "@/state/job";
import { useAxialStore } from "@/state/axial";

interface LineData {
  traceId: string;
  openCode: string;
  changeType: OpenCodeChangeType;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

interface AxialLineData {
  key: string;
  field: "title" | "description";
  changed: boolean;
  isSecondary: boolean;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

const lineColor: Record<OpenCodeChangeType, string> = {
  moved: "var(--color-amber-500)",
  unchanged: "var(--color-gray-300)",
  added: "var(--color-green-500)",
  removed: "var(--color-red-500)",
};

function bezierPath(fx: number, fy: number, tx: number, ty: number): string {
  const mx = (fx + tx) / 2;
  return `M ${fx} ${fy} C ${mx} ${fy} ${mx} ${ty} ${tx} ${ty}`;
}

export default function RegenerationReviewV2({
  job,
  projectId,
  traceListId,
}: {
  job: Job;
  projectId: string;
  traceListId: string;
}) {
  const router = useRouter();
  const removeJob = useJobStore((s) => s.removeJob);
  const setAxialCodes = useAxialStore((s) => s.setAxialCodes);
  const [isPending, startTransition] = useTransition();
  const [hoveredTraceId, setHoveredTraceId] = useState<string | null>(null);
  const [hoveredAxialLineKey, setHoveredAxialLineKey] = useState<string | null>(
    null,
  );
  const [showOpenCodes, setShowOpenCodes] = useState(false);
  const [collapsedCards, setCollapsedCards] = useState<Set<string>>(new Set());

  const meta = job.metadata as Record<string, unknown>;
  const prompt = meta?.regeneratePrompt as string | undefined;
  const original = (meta?.originalOutput ?? []) as OriginalAxialCode[];
  const pending = (meta?.pendingOutput ?? []) as PendingAxialCode[];

  const axialDiff = useMemo(
    () => computeAxialDiff(original, pending),
    [original, pending],
  );

  const axialPairingMap = useMemo(
    () =>
      new Map(
        axialDiff
          .filter((e) => e.original && e.pending)
          .map((e) => [e.pending!.title, e.original!.title]),
      ),
    [axialDiff],
  );

  const migrations = useMemo(
    () => computeOpenCodeMigrations(original, pending, axialPairingMap),
    [original, pending, axialPairingMap],
  );

  const axialDiffByOrigTitle = useMemo(
    () =>
      new Map(
        axialDiff.filter((e) => e.original).map((e) => [e.original!.title, e]),
      ),
    [axialDiff],
  );

  const axialDiffByPendTitle = useMemo(
    () =>
      new Map(
        axialDiff.filter((e) => e.pending).map((e) => [e.pending!.title, e]),
      ),
    [axialDiff],
  );

  const axialFlowConnections = useMemo(() => {
    const pendTraceToAxial = new Map<string, string>();
    for (const ax of pending) {
      for (const conn of ax.connections) {
        pendTraceToAxial.set(conn.traceId, ax.title);
      }
    }
    const connections = new Map<string, Set<string>>();
    for (const ax of original) {
      for (const conn of ax.connections) {
        const pendTitle = pendTraceToAxial.get(conn.trace.id);
        if (pendTitle) {
          if (!connections.has(ax.title)) connections.set(ax.title, new Set());
          connections.get(ax.title)!.add(pendTitle);
        }
      }
    }
    return connections;
  }, [original, pending]);

  const pendToOrigFlow = useMemo(() => {
    const result = new Map<string, Set<string>>();
    for (const [origTitle, pendTitles] of axialFlowConnections) {
      for (const pendTitle of pendTitles) {
        if (!result.has(pendTitle)) result.set(pendTitle, new Set());
        result.get(pendTitle)!.add(origTitle);
      }
    }
    return result;
  }, [axialFlowConnections]);

  const migrationByTraceId = useMemo(
    () =>
      new Map<string, OpenCodeMigration>(migrations.map((m) => [m.traceId, m])),
    [migrations],
  );

  const openCodeByTraceId = useMemo(
    () => buildTraceIdToOpenCode(original),
    [original],
  );

  const counts = useMemo(
    () => ({
      moved: migrations.filter((m) => m.changeType === "moved").length,
      added: migrations.filter((m) => m.changeType === "added").length,
      removed: migrations.filter((m) => m.changeType === "removed").length,
    }),
    [migrations],
  );

  function toggleCard(key: string) {
    setCollapsedCards((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const containerRef = useRef<HTMLDivElement>(null);
  const leftRefs = useRef<Map<string, HTMLElement>>(new Map());
  const rightRefs = useRef<Map<string, HTMLElement>>(new Map());
  const leftCardRefs = useRef<Map<string, HTMLElement>>(new Map());
  const rightCardRefs = useRef<Map<string, HTMLElement>>(new Map());
  const leftTitleRefs = useRef<Map<string, HTMLElement>>(new Map());
  const leftDescRefs = useRef<Map<string, HTMLElement>>(new Map());
  const rightTitleRefs = useRef<Map<string, HTMLElement>>(new Map());
  const rightDescRefs = useRef<Map<string, HTMLElement>>(new Map());
  const [lines, setLines] = useState<LineData[]>([]);
  const [axialLines, setAxialLines] = useState<AxialLineData[]>([]);
  const [svgHeight, setSvgHeight] = useState(0);

  const recalculate = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const cRect = container.getBoundingClientRect();
    setSvgHeight(container.offsetHeight);

    const result: LineData[] = [];
    for (const m of migrations) {
      if (m.changeType === "removed" || m.changeType === "added") continue;
      const lEl = leftRefs.current.get(m.traceId);
      const rEl = rightRefs.current.get(m.traceId);
      if (!lEl || !rEl) continue;

      const lRect = lEl.getBoundingClientRect();
      const rRect = rEl.getBoundingClientRect();
      result.push({
        traceId: m.traceId,
        openCode: m.openCode,
        changeType: m.changeType,
        fromX: lRect.right - cRect.left,
        fromY: lRect.top + lRect.height / 2 - cRect.top,
        toX: rRect.left - cRect.left,
        toY: rRect.top + rRect.height / 2 - cRect.top,
      });
    }
    setLines(result);

    const axialResult: AxialLineData[] = [];
    for (const [origTitle, pendTitles] of axialFlowConnections) {
      const lCardEl = leftCardRefs.current.get(origTitle);
      if (!lCardEl) continue;
      const lCardRect = lCardEl.getBoundingClientRect();
      const fromX = lCardRect.right - cRect.left;
      const primaryPendTitle =
        axialDiffByOrigTitle.get(origTitle)?.pending?.title;

      for (const pendTitle of pendTitles) {
        const rCardEl = rightCardRefs.current.get(pendTitle);
        if (!rCardEl) continue;
        const rCardRect = rCardEl.getBoundingClientRect();
        const toX = rCardRect.left - cRect.left;
        const pairKey = `${origTitle}||${pendTitle}`;
        const isPrimary = pendTitle === primaryPendTitle;

        if (isPrimary) {
          const entry = axialDiffByOrigTitle.get(origTitle)!;
          const titleChanged = origTitle !== pendTitle;
          const descChanged =
            entry.original?.description !== entry.pending?.description;

          if (titleChanged) {
            const lTitleEl = leftTitleRefs.current.get(origTitle);
            const rTitleEl = rightTitleRefs.current.get(pendTitle);
            if (lTitleEl && rTitleEl) {
              const lRect = lTitleEl.getBoundingClientRect();
              const rRect = rTitleEl.getBoundingClientRect();
              axialResult.push({
                key: `${pairKey}-title`,
                field: "title",
                changed: true,
                isSecondary: false,
                fromX,
                fromY: lRect.top + lRect.height / 2 - cRect.top,
                toX,
                toY: rRect.top + rRect.height / 2 - cRect.top,
              });
            }
          }

          if (descChanged) {
            const lDescEl = leftDescRefs.current.get(origTitle);
            const rDescEl = rightDescRefs.current.get(pendTitle);
            if (lDescEl && rDescEl) {
              const lRect = lDescEl.getBoundingClientRect();
              const rRect = rDescEl.getBoundingClientRect();
              axialResult.push({
                key: `${pairKey}-desc`,
                field: "description",
                changed: true,
                isSecondary: false,
                fromX,
                fromY: lRect.top + lRect.height / 2 - cRect.top,
                toX,
                toY: rRect.top + rRect.height / 2 - cRect.top,
              });
            }
          }
        } else {
          axialResult.push({
            key: `${pairKey}-split`,
            field: "title",
            changed: true,
            isSecondary: true,
            fromX,
            fromY: lCardRect.top + lCardRect.height / 2 - cRect.top,
            toX,
            toY: rCardRect.top + rCardRect.height / 2 - cRect.top,
          });
        }
      }
    }
    setAxialLines(axialResult);
  }, [migrations, axialDiffByOrigTitle, axialFlowConnections]);

  useLayoutEffect(() => {
    recalculate();
    const ro = new ResizeObserver(recalculate);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [recalculate, showOpenCodes, collapsedCards]);

  const backHref = `/${projectId}/${traceListId}/axial-codes`;

  function handleAccept() {
    startTransition(async () => {
      const toastId = toast.loading("Applying changes…");
      try {
        await acceptRegeneration(traceListId, job.id);
        removeJob(job.id);
        try {
          const freshCodes = await getAxialCodes(traceListId);
          if (freshCodes) setAxialCodes(freshCodes);
        } catch (error) {
          console.error(error);
          toast.error("Failed to refresh axial codes");
        }

        toast.success("Changes applied", { id: toastId });
        router.push(backHref);
      } catch (error) {
        console.error(error);
        toast.error("Failed to apply changes", {
          id: toastId,
          description: "Please try again later.",
        });
      }
    });
  }

  function handleReject() {
    startTransition(async () => {
      const toastId = toast.loading("Discarding changes…");
      try {
        await rejectRegeneration(traceListId, job.id);
        removeJob(job.id);
        toast.success("Changes discarded", { id: toastId });
        router.push(backHref);
      } catch {
        toast.error("Failed to discard changes", {
          id: toastId,
          description: "Please try again later.",
        });
      }
    });
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="w-full max-w-6xl mx-auto px-6 py-8 pb-12 space-y-8">
        <header className="space-y-3">
          <p className="text-sm text-muted-foreground">
            <Link
              href={backHref}
              className="inline-flex items-center gap-1 hover:underline"
            >
              <ArrowLeft className="size-3" /> Back to axial codes
            </Link>
          </p>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Review changes
            </h1>
            {prompt && (
              <p className="text-sm text-muted-foreground mt-1">
                <span className="font-medium text-foreground">Prompt:</span>{" "}
                {prompt}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2 text-sm">
            {counts.moved > 0 && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-medium text-xs">
                <ArrowRight size={11} /> {counts.moved} moved
              </span>
            )}
            {counts.added > 0 && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 font-medium text-xs">
                <Plus size={11} /> {counts.added} new
              </span>
            )}
            {counts.removed > 0 && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 font-medium text-xs">
                <Minus size={11} /> {counts.removed} disconnected
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground border rounded-lg px-4 py-2 bg-muted/20 w-fit">
              <span className="flex items-center gap-1.5">
                <svg width="20" height="6">
                  <path
                    d="M 0 3 C 7 3 13 3 20 3"
                    stroke={lineColor.moved}
                    strokeWidth="2"
                    fill="none"
                  />
                </svg>
                Moved
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="20" height="6">
                  <path
                    d="M 0 3 C 7 3 13 3 20 3"
                    stroke={lineColor.unchanged}
                    strokeWidth="1.5"
                    fill="none"
                  />
                </svg>
                Unchanged
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="8" height="8">
                  <circle cx="4" cy="4" r="3.5" fill={lineColor.added} />
                </svg>
                New
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="8" height="8">
                  <circle cx="4" cy="4" r="3.5" fill={lineColor.removed} />
                </svg>
                Disconnected
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowOpenCodes((v) => !v)}
              className="gap-1.5 text-xs h-8"
            >
              {showOpenCodes ? <EyeOff size={13} /> : <Eye size={13} />}
              {showOpenCodes ? "Hide open codes" : "Show open codes"}
            </Button>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={handleReject}
              disabled={isPending}
            >
              Discard
            </Button>
            <Button onClick={handleAccept} disabled={isPending}>
              {isPending ? (
                <>
                  <Spinner /> Applying…
                </>
              ) : (
                "Apply changes"
              )}
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-[1fr_120px_1fr] text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <span>Current ({original.length} axial codes)</span>
          <span />
          <span>New ({pending.length} axial codes)</span>
        </div>

        <div
          ref={containerRef}
          className="relative grid grid-cols-[1fr_120px_1fr] gap-0"
        >
          <svg
            className="absolute left-0 top-0 pointer-events-none"
            style={{ width: "100%", height: svgHeight, overflow: "visible" }}
          >
            {showOpenCodes &&
              lines.map((line) => {
                const isHovered = hoveredTraceId === line.traceId;
                const color = lineColor[line.changeType];
                const opacity = hoveredTraceId
                  ? isHovered
                    ? 0.75
                    : 0.04
                  : line.changeType === "unchanged"
                    ? 0.14
                    : 0.3;

                return (
                  <g key={line.traceId}>
                    <path
                      d={bezierPath(line.fromX, line.fromY, line.toX, line.toY)}
                      stroke="transparent"
                      strokeWidth="16"
                      fill="none"
                      className="cursor-pointer pointer-events-auto"
                      onMouseEnter={() => setHoveredTraceId(line.traceId)}
                      onMouseLeave={() => setHoveredTraceId(null)}
                    />
                    <path
                      d={bezierPath(line.fromX, line.fromY, line.toX, line.toY)}
                      stroke={color}
                      strokeWidth={
                        isHovered
                          ? 1.5
                          : line.changeType === "unchanged"
                            ? 0.75
                            : 1
                      }
                      fill="none"
                      opacity={opacity}
                      strokeDasharray={
                        line.changeType === "unchanged" ? "4 3" : undefined
                      }
                      style={{
                        transition: "opacity 0.15s, stroke-width 0.1s",
                      }}
                    />
                    <circle
                      cx={line.fromX}
                      cy={line.fromY}
                      r={isHovered ? 3 : 2.5}
                      fill={color}
                      opacity={opacity}
                      style={{ transition: "opacity 0.15s, r 0.1s" }}
                    />
                    <circle
                      cx={line.toX}
                      cy={line.toY}
                      r={isHovered ? 3 : 2.5}
                      fill={color}
                      opacity={opacity}
                      style={{ transition: "opacity 0.15s, r 0.1s" }}
                    />
                    {isHovered && (
                      <text
                        x={(line.fromX + line.toX) / 2}
                        y={(line.fromY + line.toY) / 2 - 8}
                        textAnchor="middle"
                        fontSize="11"
                        fill={color}
                        className="font-medium"
                      >
                        {line.openCode}
                      </text>
                    )}
                  </g>
                );
              })}
            {axialLines.map((line) => {
              const isHovered = hoveredAxialLineKey === line.key;
              const label = line.isSecondary
                ? "Split"
                : line.field === "title"
                  ? "Title"
                  : "Description";
              return (
                <g key={line.key}>
                  <path
                    d={bezierPath(line.fromX, line.fromY, line.toX, line.toY)}
                    stroke="transparent"
                    strokeWidth="14"
                    fill="none"
                    className="cursor-pointer pointer-events-auto"
                    onMouseEnter={() => setHoveredAxialLineKey(line.key)}
                    onMouseLeave={() => setHoveredAxialLineKey(null)}
                  />
                  <path
                    d={bezierPath(line.fromX, line.fromY, line.toX, line.toY)}
                    stroke="var(--color-amber-500)"
                    strokeWidth={isHovered ? 3.5 : line.isSecondary ? 1.5 : 2.5}
                    fill="none"
                    opacity={isHovered ? 0.9 : line.isSecondary ? 0.4 : 0.7}
                    strokeDasharray={line.isSecondary ? "5 4" : undefined}
                    style={{ transition: "opacity 0.15s, stroke-width 0.1s" }}
                  />
                  {isHovered && (
                    <text
                      x={(line.fromX + line.toX) / 2}
                      y={(line.fromY + line.toY) / 2 - 8}
                      textAnchor="middle"
                      fontSize="11"
                      fill="var(--color-amber-600)"
                      className="font-medium pointer-events-none"
                    >
                      {label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          <div className="space-y-2 pr-2">
            {original.map((axial) => {
              const cardKey = `left:${axial.title}`;
              const entry = axialDiffByOrigTitle.get(axial.title);
              const diffStatus = entry?.status;
              const titleChanged =
                !!entry?.pending &&
                entry.original?.title !== entry.pending.title;
              const descChanged =
                !!entry?.pending &&
                entry.original?.description !== entry.pending.description;
              return (
                <AxialReviewCard
                  key={axial.title}
                  title={axial.title}
                  description={axial.description}
                  feedback={axial.feedback}
                  side="left"
                  items={axial.connections.map((c) => ({
                    traceId: c.trace.id,
                    label:
                      c.trace.openCode ?? `(trace ${c.trace.id.slice(0, 6)}…)`,
                    changeType:
                      migrationByTraceId.get(c.trace.id)?.changeType ??
                      "unchanged",
                  }))}
                  showOpenCodes={showOpenCodes}
                  isCollapsed={collapsedCards.has(cardKey)}
                  onToggleCollapse={() => toggleCard(cardKey)}
                  hoveredTraceId={hoveredTraceId}
                  onHover={setHoveredTraceId}
                  refMap={leftRefs}
                  diffStatus={diffStatus}
                  titleChanged={titleChanged}
                  descChanged={descChanged}
                  cardRef={(el) => {
                    if (el) leftCardRefs.current.set(axial.title, el);
                    else leftCardRefs.current.delete(axial.title);
                  }}
                  titleRef={(el) => {
                    if (el) leftTitleRefs.current.set(axial.title, el);
                    else leftTitleRefs.current.delete(axial.title);
                  }}
                  descRef={(el) => {
                    if (el) leftDescRefs.current.set(axial.title, el);
                    else leftDescRefs.current.delete(axial.title);
                  }}
                />
              );
            })}
          </div>

          <div />

          <div className="space-y-2 pl-2">
            {pending.map((axial) => {
              const cardKey = `right:${axial.title}`;
              const entry = axialDiffByPendTitle.get(axial.title);
              const rawDiffStatus = entry?.status;
              const titleChanged =
                !!entry?.original &&
                entry.original.title !== entry.pending?.title;
              const descChanged =
                !!entry?.original &&
                entry.original.description !== entry.pending?.description;
              const isSplitTarget =
                rawDiffStatus === "added" &&
                (pendToOrigFlow.get(axial.title)?.size ?? 0) > 0;
              const diffStatus = isSplitTarget ? "modified" : rawDiffStatus;
              return (
                <AxialReviewCard
                  key={axial.title}
                  title={axial.title}
                  description={axial.description}
                  side="right"
                  items={axial.connections.map((c) => ({
                    traceId: c.traceId,
                    label:
                      openCodeByTraceId.get(c.traceId) ??
                      `(trace ${c.traceId.slice(0, 6)}…)`,
                    changeType:
                      migrationByTraceId.get(c.traceId)?.changeType ??
                      "unchanged",
                  }))}
                  showOpenCodes={showOpenCodes}
                  isCollapsed={collapsedCards.has(cardKey)}
                  onToggleCollapse={() => toggleCard(cardKey)}
                  hoveredTraceId={hoveredTraceId}
                  onHover={setHoveredTraceId}
                  refMap={rightRefs}
                  diffStatus={diffStatus}
                  isSplitTarget={isSplitTarget}
                  titleChanged={titleChanged}
                  descChanged={descChanged}
                  cardRef={(el) => {
                    if (el) rightCardRefs.current.set(axial.title, el);
                    else rightCardRefs.current.delete(axial.title);
                  }}
                  titleRef={(el) => {
                    if (el) rightTitleRefs.current.set(axial.title, el);
                    else rightTitleRefs.current.delete(axial.title);
                  }}
                  descRef={(el) => {
                    if (el) rightDescRefs.current.set(axial.title, el);
                    else rightDescRefs.current.delete(axial.title);
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
