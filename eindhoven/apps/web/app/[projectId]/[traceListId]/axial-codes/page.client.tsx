"use client";

import {
  Check,
  FileWarningIcon,
  LoaderCircle,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";

import { getRandomLoadingMessage } from "@/lib/loading-messages";
import { useAxialStore } from "@/state/axial";
import { useTraceStore } from "@/state/trace";
import { useProjectStore } from "@/state/project";
import { updateTracelist } from "@/app/[projectId]/actions";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { AxialCodeDistributionChart } from "@/components/axial-code/axial-code-chart";

export default function ClientPage() {

  const [savingState, setSavingState] = useState<"saved" | "saving" | "error">(
    "saved",
  );
  const savingStates: {
    state: "saving" | "saved" | "error";
    color: string;
    active?: string;
  }[] = [
    {
      state: "saving",
      color: "gray-400",
      active: "animate-spin",
    },
    {
      state: "saved",
      color: "green-500",
    },
    {
      state: "error",
      color: "red-500",
    },
  ];

  const axialCodes = useAxialStore((s) => s.axialCodes);
  const traceList = useTraceStore((s) => s.traceList);
  const project = useProjectStore((s) => s.project);
  const setTraceList = useTraceStore((s) => s.setTraceList);

  const [feedback, setFeedback] = useState<string>(traceList?.axialCodeFeedback || "")

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFeedback(traceList?.axialCodeFeedback || "");
  }, [traceList?.axialCodeFeedback]);

  function updateGlobalFeedback() {
    if (!traceList) return;
    setSavingState("saving");

    try {
      updateTracelist({
        traceListId: traceList.id,
        newName: traceList.name,
        axialCodeFeedback: feedback,
      })
        .then(() => setTraceList({...traceList, axialCodeFeedback: feedback}))
        .catch(() => {
        setSavingState("error");
      });
    } catch (e) {
      setSavingState("error");
    } finally {
      setSavingState("saved");
    }
  }

  if (!axialCodes) {
    return (
      <div className="flex h-full w-full items-center justify-center flex-col gap-2">
        <Spinner />
        <p className="text-sm text-muted-foreground">
          {getRandomLoadingMessage()}
        </p>
      </div>
    );
  }

  if (axialCodes.length == 0) {
    return (
      <Empty data-testid="empty-tracelists-container" className={"h-full"}>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileWarningIcon />
          </EmptyMedia>
          <EmptyTitle data-testid="empty-tracelists-label">
            This list does not contain any axial codes.
          </EmptyTitle>
          <EmptyDescription>
            You haven&apos;t generated axial codes yet.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="flex-row justify-center gap-2">
          <Link href={`/${project?.id}/${traceList?.id}/traces`}>
            <Button>Generate</Button>
          </Link>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="max-h-full h-full w-full grid grid-cols-3 items-start justify-start gap-4">
      <div className="col-span-1 flex flex-col gap-4">
        <AxialCodeDistributionChart />
      </div>
      <div className="h-full flex flex-col gap-2 col-span-2">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">List feedback</h2>
          {([LoaderCircle, Check, TriangleAlert] as const).map(
            (Icon, index) => {
              const state = savingStates[index];

              return (
                savingState === state.state && (
                  <Icon
                    key={index}
                    className={`size-4 text-${state.color} transition-opacity duration-300 ${
                      state.active
                    }`}
                  />
                )
              );
            },
          )}
        </div>
        <Textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          onBlur={() => updateGlobalFeedback()}
          className={`h-full resize-none`}
          placeholder={`Type some feedback here, like: "Reduce the amount of axial codes"`}
        />
      </div>
    </div>
  );
}
