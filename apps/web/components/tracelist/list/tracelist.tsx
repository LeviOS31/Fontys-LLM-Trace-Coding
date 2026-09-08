"use client";

import { useEffect, useRef } from "react";
import { useParams, usePathname } from "next/navigation";
import TracelistEntry from "@/components/tracelist/list/tracelist-entry";
import {
  traceIsTodo,
  useFilteredTraces,
  useTodoCount,
} from "@/components/tracelist/list/tracelist-functions";
import { Checkbox } from "@/components/ui/checkbox";
import { useTraceStore } from "@/state/trace";
import { useProjectStore } from "@/state/project";
import { PartialTrace } from "@/lib/types";
import TracelistAxial from "./tracelist-axial";

export default function Tracelist() {
  const currentTraceRef = useRef<HTMLAnchorElement>(null);
  const params = useParams();
  const route = usePathname();
  const currentTraceId = params.trace;
  const traceListId = params.traceListId as string;
  const traceList = useTraceStore((s) => s.traceList);
  const setNextTrace = useTraceStore((s) => s.setNextTrace);
  const traceListBehavior = useTraceStore((s) => s.traceListBehavior);
  const setTraceListBehavior = useTraceStore((s) => s.setTraceListBehavior);

  const todoCount = useTodoCount(traceList?.traces ?? []);

  const project = useProjectStore((s) => s.project);

  const filteredData: PartialTrace[] = useFilteredTraces(
    traceList?.traces ?? [],
    traceListBehavior.hideCompleted,
    traceListBehavior.isolateFlagged,
  );

  useEffect(() => {
    currentTraceRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    if (filteredData.length === 0) {
      setNextTrace("");
      return;
    }

    const currentIndex = filteredData.findIndex((t) => t.id === currentTraceId);
    const remaining = filteredData.slice(currentIndex + 1);

    if (remaining.length === 0) {
      setNextTrace("");
      return;
    }

    const wrapped = [...remaining, ...filteredData.slice(0, currentIndex)];
    const candidates = traceListBehavior.skipCompleted
      ? wrapped.filter(traceIsTodo)
      : wrapped;

    setNextTrace(
      candidates.length > 0
        ? candidates[0].id
        : remaining.length > 0
          ? remaining[0].id
          : "",
    );
  }, [
    currentTraceId,
    filteredData,
    setNextTrace,
    traceListBehavior.skipCompleted,
  ]);

  if (!route.includes("/traces")) {
    return null;
  }

  return (
    <div
      className="relative bg-neutral-50 border-r min-w-70 w-70 max-w-70 h-screen py-4 flex flex-col gap-4"
      data-testid="trace-list"
      style={{
        width: 280,
      }}
    >
      {traceList && (
        <>
          <div className="px-4" data-testid={"tracelist-info"}>
            <div className="mb-0">
              <p className="font-medium">
                {traceList.name == "" ? "Untitled" : traceList.name}
              </p>
              <p className={"text-sm"}>
                {traceList.traces.length} traces | {todoCount} to-do
              </p>
            </div>
            <div
              className={
                "gap-y-1 grid grid-cols-2 justify-center align-middle items-center *:even:ml-auto"
              }
            >
              <p className={"text-xs"}>Hide processed</p>
              <Checkbox
                data-testid="filter-hide-completed"
                checked={traceListBehavior.hideCompleted}
                onCheckedChange={(v) =>
                  setTraceListBehavior({
                    ...traceListBehavior,
                    hideCompleted: Boolean(v),
                  })
                }
                className="size-4"
              />
              <p className={"text-xs"}>Only show flagged</p>
              <Checkbox
                data-testid="filter-show-flagged"
                checked={traceListBehavior.isolateFlagged}
                onCheckedChange={(v) =>
                  setTraceListBehavior({
                    ...traceListBehavior,
                    isolateFlagged: Boolean(v),
                  })
                }
                className="size-4"
              />
              <p className={"text-xs"}>Skip completed</p>
              <Checkbox
                data-testid="toggle-skip-completed"
                checked={traceListBehavior.skipCompleted}
                onCheckedChange={(v) =>
                  setTraceListBehavior({
                    ...traceListBehavior,
                    skipCompleted: Boolean(v),
                  })
                }
                className="size-4"
              />
            </div>
            <div className={"text-xs text-neutral-500"}>
              <p>
                Displaying {filteredData.length} of {traceList.traces.length}
              </p>
            </div>
          </div>
        </>
      )}

      {!traceList && (
        <div className="h-full flex items-center justify-center">
          <p className={"animate-pulse text-neutral-700 text-sm"}>
            Loading tracelist...
          </p>
        </div>
      )}

      {traceList && traceList.traces.length == 0 && (
        <div
          data-testid="empty-tracelist-container"
          className="bg-orange-100 rounded-xl p-4 mx-4"
        >
          <p
            data-testid="empty-tracelist-label"
            className={"text-neutral-700 text-sm"}
          >
            This tracelist is empty.
          </p>
        </div>
      )}

      <div className={"overflow-auto flex flex-col h-full"}>
        {filteredData.map((trace, index) => (
          <TracelistEntry
            key={index}
            trace={trace}
            currentTraceId={currentTraceId as string}
            currentTraceRef={currentTraceRef}
            projectId={project?.id ?? ""}
            traceListId={traceListId}
          />
        ))}
      </div>

      <TracelistAxial
        traceListId={traceListId}
        projectId={project?.id ?? ""}
        todoCount={todoCount}
        traceListLength={traceList?.traces.length ?? 0}
      />
    </div>
  );
}
