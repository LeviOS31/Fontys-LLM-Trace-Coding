"use client";
import TracelistIndexEntry from "@/components/tracelist/index/tracelist-index-entry";
import { TracelistInfo } from "@/lib/types";

export default function TracelistIndexCards({
  filteredTracelists,
}: {
  filteredTracelists: TracelistInfo[];
}) {
  return (
    <>
      <div className={"flex flex-row gap-2 items-center mb-3 ml-2"}>
        <div className={"h-1 w-3 bg-green-300 rounded-full"}></div>
        <p className={"text-green-700"}>positive</p>
        <div className={"h-1 w-3 bg-red-300 rounded-full"}></div>
        <p className={"text-red-700"}>negative</p>
        <div className={"h-1 w-3 bg-neutral-300 rounded-full"}></div>
        <p className={"text-neutral-700"}>pending</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 w-full overflow-auto p-1">
        {filteredTracelists.map((traceList) => (
          <TracelistIndexEntry key={traceList.id} traceList={traceList} />
        ))}
        {filteredTracelists.length == 0 && (
          <p className={"text-muted-foreground"}>No results were found.</p>
        )}
      </div>
    </>
  );
}
