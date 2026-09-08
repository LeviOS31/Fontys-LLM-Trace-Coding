"use client";

import Link from "next/link";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate } from "date-fns";
import { EllipsisVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import RenameTracelistDialog from "./rename-tracelist-dialog";
import DeleteTracelistDialog from "./delete-tracelist-dialog";
import { TracelistInfo } from "@/lib/types";
import { useProjectStore } from "@/state/project";
import TracelistStatBar from "@/components/tracelist/index/tracelist-stat-bar";
import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusIndicator } from "@/components/tracelist/index/status-indicator";

export default function TracelistIndexEntry({
  traceList,
}: {
  traceList: TracelistInfo;
}) {
  const project = useProjectStore((s) => s.project);

  return (
    <Card className={"flex relative hover:bg-neutral-50 flex-col"}>
      <Link
        data-testid="trace-list-card"
        href={`/${project?.id}/${traceList.id}/traces`}
        key={traceList.id}
        className={"absolute inset-0 z-0"}
      />

      {traceList.axialCodes.length > 0 && (
        <div
          className={
            "flex flex-col p-4 top-3 bottom-3 right-0 left-[50%] pointer-events-none absolute border-l"
          }
        >
          <p>Axial codes</p>
          {traceList.axialCodes
            .toSorted((a) => a.traceAmount)
            .map((a, i) => (
              <div key={i} className={"flex text-muted-foreground"}>
                <p className={"w-5"}>{a.traceAmount}x</p>
                <p>{a.name}</p>
              </div>
            ))}
        </div>
      )}

      <CardHeader className={"grow"}>
        <CardTitle
          data-testid="trace-list-title"
          className={traceList.name == "" ? "italic" : ""}
        >
          {traceList.name == "" ? "Untitled" : traceList.name}
        </CardTitle>
        <CardDescription data-testid="trace-list-date">
          {formatDate(traceList.createdAt, "eeee, MMMM d yyyy")}
          <StatusIndicator list={traceList} />
        </CardDescription>
        <CardAction className={"z-50"}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size={"icon"} variant={"ghost"} type={"button"}>
                <EllipsisVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className={"grid-cols-1 grid"}>
              <RenameTracelistDialog traceList={traceList} />
              <DeleteTracelistDialog traceList={traceList} />
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>
      <CardContent data-testid="trace-list-counts" className="">
        <div
          className={`grid relative ${traceList.axialCodes.length > 0 ? "grid-cols-2" : "grid-cols-1"} gap-12`}
        >
          <TracelistStatBar traceList={traceList} />
        </div>
      </CardContent>
    </Card>
  );
}
