import Link from "next/link";
import TraceIcon from "@/components/tracelist/list/trace-icon";
import TraceOCLabel from "@/components/tracelist/list/trace-oc-label";
import { RefObject } from "react";
import { PartialTrace } from "@/lib/types";

export default function TracelistEntry({
  trace,
  currentTraceId,
  currentTraceRef,
  projectId,
  traceListId,
}: {
  trace: PartialTrace;
  currentTraceId: string;
  currentTraceRef: RefObject<HTMLAnchorElement | null>;
  projectId: string;
  traceListId: string;
}) {
  function get_trace_color() {
    if (trace.isFlagged) {
      return "bg-orange-200";
    }

    switch (trace.feedback) {
      case "positive":
        return "bg-green-200";
      case "negative":
        return "bg-red-200";
    }

    return "bg-neutral-200";
  }

  return (
    <Link
      ref={(e) => {
        if (trace.id === currentTraceId) {
          currentTraceRef.current = e;
        }
      }}
      key={trace.id}
      data-testid={"trace-list-item"}
      data-status={!!trace.feedback}
      data-flagged={trace.isFlagged}
      href={`/${projectId}/${traceListId}/traces/${trace.id}`}
      className={`grid bg-neutral-50 first:border-t px-4 py-1 last:border-b hover:bg-neutral-100 border-b  border-neutral-300 cursor-pointer hover:opacity-80 items-center grid-cols-10 ${currentTraceId == trace.id ? "active !bg-neutral-200" : ""}`}
    >
      <div
        data-testid={"trace-assessment"}
        className={`flex rounded-xl aspect-square ${get_trace_color()} items-center justify-center`}
      >
        <TraceIcon size={12} trace={trace} />
      </div>
      <p
        data-testid="trace-preview"
        className="block ml-3 py-2 col-span-6 text-xs"
      >
        {trace.input_preview}...
      </p>
      <div
        data-testid="trace-open-code-indicator"
        className={"col-span-2 text-right text-xs"}
      >
        <TraceOCLabel trace={trace} />
      </div>
    </Link>
  );
}
