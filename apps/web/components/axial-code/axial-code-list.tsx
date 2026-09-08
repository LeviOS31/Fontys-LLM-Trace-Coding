"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";

import { AxialCode } from "@/lib/types";
import { useAxialStore } from "@/state/axial";
import { useTraceStore } from "@/state/trace";
import { useJobStore } from "@/state/job";
import { regenerateAxialCodes } from "@/app/[projectId]/[traceListId]/axial-codes/actions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import AxialCodeListItem from "@/components/axial-code/axial-code-list-item";
import { Badge } from "@/components/ui/badge";
import { Table } from "lucide-react";

export default function AxialCodeList() {
  const router = useRouter();
  const route = usePathname();
  const axialCodes = useAxialStore((s) => s.axialCodes);
  const jobs = useJobStore((s) => s.jobs);
  const addJob = useJobStore((s) => s.addJob);
  const traceList = useTraceStore((s) => s.traceList);
  const setTraceList = useTraceStore((s) => s.setTraceList);
  const setSelectedAxialCodeId = useAxialStore((s) => s.setSelectedAxialCodeId);
  const selectedAxialCodeId = useAxialStore((s) => s.selectedAxialCodeId);

  const isJobRunning = useMemo(() => {
    return jobs.some((j) => j.status === "PROCESSING");
  }, [jobs]);

  function onClick(code: AxialCode) {
    const basePath = route.split("/axial-codes")[0];
    router.push(`${basePath}/axial-codes/${code.id}`);
    setSelectedAxialCodeId(code.id);
  }

  function onRegenerateClick() {
    if (!traceList) return;
    regenerateAxialCodes(traceList?.id)
      .then((j) => {
        addJob(j);
        setTraceList({...traceList, axialCodeFeedback: ""})
      })
      .catch(console.error);
  }

  if (!route.includes("/axial-codes")) return null;

  return (
    <div className="flex flex-col border-r h-screen bg-neutral-50 w-70 overflow-hidden">
      {!axialCodes ? (
        <div className="h-full w-full">
          <div className="flex items-center font-medium border-b p-4 h-20">
            <Skeleton className="h-6 w-2/3 rounded" />
          </div>
          <ScrollArea className="h-full">
            {Array.from({ length: 20 }).map((_, index) => (
              <div
                key={index}
                className={`border-b p-4 cursor-pointer hover:bg-neutral-100 focus:bg-neutral-100 h-20 flex flex-col gap-2`}
              >
                <Skeleton className="h-6 w-2/3 rounded" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </ScrollArea>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          <button
            className={`h-20 shrink-0 flex flex-col items-start font-semibold border-b p-4 cursor-pointer hover:bg-neutral-100 focus:bg-neutral-10 ${!selectedAxialCodeId && "bg-neutral-100"}`}
            onClick={(e) => {
              e.preventDefault();
              setSelectedAxialCodeId("");
              router.push(route.split("/axial-codes")[0] + "/axial-codes");
            }}
          >
            All axial codes
            <Badge>
              <Table />
              <p data-testid="axial-amount">{axialCodes.length}</p>
            </Badge>
          </button>

          <ScrollArea className="flex-1 min-h-0">
            <div>
              {axialCodes
                .sort((a, b) => a.title.localeCompare(b.title))
                .map((code: AxialCode, index: number) => (
                  <AxialCodeListItem
                    key={index}
                    axialCode={code}
                    onClick={onClick}
                    selected={code.id === selectedAxialCodeId}
                  />
                ))}
            </div>
          </ScrollArea>

          {axialCodes.length > 0 && (
            <div className="shrink-0 p-4">
              <Button
                disabled={isJobRunning}
                onClick={() => onRegenerateClick()}
                className="w-full"
              >
                Regenerate
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
