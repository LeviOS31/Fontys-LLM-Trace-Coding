"use client";

import { TracelistInfo } from "@/lib/types";

export default function TracelistStatBar({
  traceList,
}: {
  traceList: TracelistInfo;
}) {
  const total =
    traceList.status.pending +
    traceList.status.negative +
    traceList.status.positive;
  return (
    <div className={"w-full flex gap-1 *:h-2 rounded-full"}>
      <div
        className={`items-center ${traceList.status.positive > 0 ? "" : "hidden"}`}
        style={{ width: `${(traceList.status.positive / total) * 100}%` }}
      >
        <div className={"bg-green-300 w-full h-2 rounded-full"}></div>
        <p className={"text-center text-xs text-green-700"}>
          {traceList.status.positive}
        </p>
      </div>
      <div
        className={`items-center ${traceList.status.negative > 0 ? "" : "hidden"}`}
        style={{ width: `${(traceList.status.negative / total) * 100}%` }}
      >
        <div className={"bg-red-300 w-full h-2 rounded-full"}></div>
        <p className={"text-center text-xs text-red-700"}>
          {traceList.status.negative}
        </p>
      </div>
      <div
        className={`items-center ${traceList.status.pending > 0 ? "" : "hidden"}`}
        style={{ width: `${(traceList.status.pending / total) * 100}%` }}
      >
        <div className={"bg-neutral-300 w-full h-2 rounded-full"}></div>
        <p className={"text-center text-xs text-neutral-700"}>
          {traceList.status.pending}
        </p>
      </div>
    </div>
  );
}
