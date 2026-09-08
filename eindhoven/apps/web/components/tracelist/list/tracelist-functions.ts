import { useMemo } from "react";
import { PartialTrace } from "@/lib/types";

export function useTodoCount(traceList: PartialTrace[]) {
  return useMemo(
    () => traceList.filter((d) => !d.feedback || d.isFlagged).length,
    [traceList],
  );
}

export function traceIsTodo(trace: PartialTrace) {
  return (
    !trace.feedback ||
    trace.isFlagged ||
    (trace.feedback === "negative" && !trace.hasOpenCode)
  );
}

export function useFilteredTraces(
  traceList: PartialTrace[],
  hideFilled: boolean,
  onlyShowFlagged: boolean,
) {
  return useMemo(() => {
    let out = traceList;
    if (hideFilled) {
      out = traceList.filter((trace) => traceIsTodo(trace));
    }
    if (onlyShowFlagged) {
      out = out.filter((trace) => trace.isFlagged);
    }
    return out.sort((a, b) => b.id.localeCompare(a.id));
  }, [traceList, hideFilled, onlyShowFlagged]);
}
