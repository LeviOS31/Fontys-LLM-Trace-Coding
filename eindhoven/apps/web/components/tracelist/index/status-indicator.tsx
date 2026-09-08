import { TracelistInfo } from "@/lib/types";
import { Check, Clock, ListTodo } from "lucide-react";
import * as React from "react";

export function StatusIndicator({ list }: { list: TracelistInfo }) {
  const inProgress = list.status.positive > 0 || list.status.negative > 0;
  const state = inProgress
    ? list.status.pending > 0
      ? "progress"
      : "finished"
    : "to-do";

  return (
    <div className={"flex items-center gap-1 align-middle mt-1"}>
      {state == "finished" && <Check color={"green"} size={13} />}
      {state == "progress" && <Clock color={"orange"} size={13} />}
      {state == "to-do" && <ListTodo size={13} />}
      <p
        className={`-mt-0.5 ${state == "progress" && "text-orange-500"} ${state == "finished" && "text-green-700"}`}
      >
        {state == "finished" && "Completed"}
        {state == "progress" && "In progress"}
        {state == "to-do" && "To-do"}
      </p>
    </div>
  );
}
