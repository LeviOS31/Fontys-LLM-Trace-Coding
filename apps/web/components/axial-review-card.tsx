"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { type DiffStatus, type OpenCodeChangeType } from "@/lib/types";
import { cn } from "@/lib/utils";

const dotColor: Record<OpenCodeChangeType, string> = {
  moved: "var(--color-amber-500)",
  unchanged: "var(--color-gray-300)",
  added: "var(--color-green-500)",
  removed: "var(--color-red-500)",
};

const itemStyle: Record<OpenCodeChangeType, string> = {
  moved: "text-amber-800 font-medium",
  unchanged: "text-muted-foreground",
  added: "text-green-800 font-medium",
  removed: "text-red-700 line-through",
};

export function AxialReviewCard({
  title,
  description,
  feedback,
  side,
  items,
  showOpenCodes,
  isCollapsed,
  onToggleCollapse,
  hoveredTraceId,
  onHover,
  refMap,
  diffStatus,
  isSplitTarget,
  titleChanged,
  descChanged,
  cardRef,
  titleRef,
  descRef,
}: {
  title: string;
  description: string;
  feedback?: string | null;
  side: "left" | "right";
  items: { traceId: string; label: string; changeType: OpenCodeChangeType }[];
  showOpenCodes: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  hoveredTraceId: string | null;
  onHover: (id: string | null) => void;
  refMap: React.RefObject<Map<string, HTMLElement>>;
  diffStatus?: DiffStatus;
  isSplitTarget?: boolean;
  titleChanged?: boolean;
  descChanged?: boolean;
  cardRef?: (el: HTMLDivElement | null) => void;
  titleRef?: (el: HTMLElement | null) => void;
  descRef?: (el: HTMLElement | null) => void;
}) {
  const hasChanged = items.some((i) => i.changeType !== "unchanged");
  const changedCount = items.filter((i) => i.changeType !== "unchanged").length;
  const expanded = showOpenCodes && !isCollapsed;

  const axialHasChanges =
    diffStatus === "modified" ||
    diffStatus === "added" ||
    diffStatus === "removed";
  const cardHasChanges = axialHasChanges || (showOpenCodes && hasChanged);

  return (
    <div
      ref={cardRef}
      className={cn(
        "rounded-lg border transition-shadow",
        cardHasChanges
          ? diffStatus === "removed"
            ? "border-red-200 bg-red-50/30"
            : diffStatus === "added"
              ? "border-green-200 bg-green-50/30"
              : "border-amber-200 bg-amber-50/30"
          : "border-border bg-muted/10",
      )}
    >
      <button
        type="button"
        onClick={onToggleCollapse}
        disabled={!showOpenCodes}
        className={cn(
          "w-full flex items-start gap-2 px-3 py-2.5 text-left rounded-lg",
          showOpenCodes && "hover:bg-black/[0.02] cursor-pointer",
          !showOpenCodes && "cursor-default",
        )}
      >
        {showOpenCodes && (
          <span className="mt-0.5 shrink-0 text-muted-foreground">
            {isCollapsed ? (
              <ChevronRight size={14} />
            ) : (
              <ChevronDown size={14} />
            )}
          </span>
        )}
        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <p
              ref={(el) => titleRef?.(el)}
              className={cn(
                "text-sm font-semibold leading-snug",
                titleChanged && "text-amber-800",
              )}
            >
              {title}
            </p>
            {diffStatus && diffStatus !== "unchanged" && (
              <span
                className={cn(
                  "text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0",
                  diffStatus === "modified" && "bg-amber-200 text-amber-900",
                  diffStatus === "added" && "bg-green-100 text-green-800",
                  diffStatus === "removed" && "bg-red-100 text-red-800",
                )}
              >
                {diffStatus === "modified"
                  ? isSplitTarget
                    ? "split"
                    : "changed"
                  : diffStatus === "added"
                    ? "new"
                    : "removed"}
              </span>
            )}
            {showOpenCodes && hasChanged && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 shrink-0">
                {changedCount} open codes changed
              </span>
            )}
            {showOpenCodes && !expanded && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
                {items.length} open codes
              </span>
            )}
          </div>
          {description && (
            <p
              ref={(el) => descRef?.(el)}
              className={cn(
                "text-xs",
                descChanged
                  ? "text-amber-700 font-medium"
                  : "text-muted-foreground",
                showOpenCodes && "line-clamp-1",
              )}
            >
              {description}
            </p>
          )}
          {feedback && (
            <p className="text-xs text-amber-700 mt-0.5 line-clamp-2">
              <span className="font-medium">Prompt: </span>
              {feedback}
            </p>
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-2.5">
          <div className="border-t border-border/70 pt-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
              Open codes ({items.length})
            </p>
            <ul className="space-y-0.5">
              {items.map((item) => {
                const isHovered = hoveredTraceId === item.traceId;
                return (
                  <li
                    key={item.traceId}
                    ref={(el) => {
                      if (el) refMap.current?.set(item.traceId, el);
                      else refMap.current?.delete(item.traceId);
                    }}
                    onMouseEnter={() => onHover(item.traceId)}
                    onMouseLeave={() => onHover(null)}
                    className={cn(
                      "text-xs flex items-center gap-1.5 rounded px-1.5 py-0.5 cursor-default transition-colors select-none",
                      itemStyle[item.changeType],
                      isHovered && "bg-amber-100/80",
                      side === "right" && "flex-row-reverse",
                    )}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{
                        backgroundColor: dotColor[item.changeType],
                        opacity: item.changeType === "unchanged" ? 0.35 : 1,
                      }}
                    />
                    <span className="truncate">{item.label}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
