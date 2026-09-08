import { create } from "zustand";
import { Tracelist, PartialTrace } from "@/lib/types";
import { traceIsTodo } from "@/components/tracelist/list/tracelist-functions";

interface TraceListBehavior {
  hideCompleted: boolean;
  isolateFlagged: boolean;
  skipCompleted: boolean;
}

interface TraceState {
  traceList: Tracelist | null;
  setTraceList: (newTraces: Tracelist | null) => void;
  nextTrace: string | null;

  traceListBehavior: TraceListBehavior;
  setTraceListBehavior: (behavior: TraceListBehavior) => void;
  setNextTrace: (nextTrace: string) => void;
}

export const useTraceStore = create<TraceState>()((set) => ({
  traceList: null,
  setTraceList: (traceList) => set(() => ({ traceList })),
  nextTrace: null,
  setNextTrace: (nextTrace) => set(() => ({ nextTrace: nextTrace })),

  traceListBehavior: {
    hideCompleted: false,
    isolateFlagged: false,
    skipCompleted: true,
  },

  setTraceListBehavior: (behavior) =>
    set(() => ({ traceListBehavior: behavior })),
}));

export const selectFilteredTraces = (state: TraceState): PartialTrace[] => {
  const traces = state.traceList?.traces ?? [];

  const { hideCompleted, isolateFlagged } = state.traceListBehavior;

  const filtered = traces.filter((trace) => {
    if (hideCompleted && !traceIsTodo(trace)) return false;
    return !(isolateFlagged && !trace.isFlagged);
  });

  return filtered.sort((a, b) => b.id.localeCompare(a.id));
};
