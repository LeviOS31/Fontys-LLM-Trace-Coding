"use client";

import { useState } from "react";
import { Check, LoaderCircle, TriangleAlert } from "lucide-react";
import Link from "next/link";

import { AxialCode } from "@/lib/types";
import { updateAxialCode } from "@/app/[projectId]/[traceListId]/axial-codes/actions";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props {
  projectId: string;
  axialCode: AxialCode;
}

export default function AxialCodeView({ projectId, axialCode }: Props) {
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

  function giveFeedback(feedback: string) {
    if (!feedback) return;
    setSavingState("saving");

    try {
      updateAxialCode({
        traceListId: axialCode?.traceListId as string,
        axialCodeId: axialCode?.id as string,
        title: axialCode!.title,
        description: axialCode!.description,
        feedback: feedback,
      }).catch(() => {
        setSavingState("error");
      });
    } catch (e) {
      setSavingState("error");
    } finally {
      setSavingState("saved");
    }
  }

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="grid gap-3 h-full grid-cols-2">
        <div className="flex flex-col gap-2 flex-1">
          <div>
            <h2 className="text-xl font-semibold">Axial-code feedback</h2>
            <div className="flex justify-between gap-0 items-center">
              <p className="text-sm text-neutral-600">
                Give individual feedback on this axial code.
              </p>
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
          </div>

          <Textarea
            className="h-full resize-none"
            defaultValue={axialCode.feedback ?? ""}
            placeholder={`Type some feedback here, like: "Too specific, should be more generic"`}
            onBlur={(e) => giveFeedback(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2 flex-1">
          <div>
            <h2 className="text-xl font-semibold flex flex-row gap-1 items-center">
              Opencodes <Badge>{axialCode.connections.length}</Badge>
            </h2>
            <p className="text-sm text-neutral-600">
              List of connected opencodes for this axial code.
            </p>
          </div>

          <ScrollArea>
            <div className="space-y-2">
              {axialCode.connections?.map((connection) => (
                <Link
                  data-testid={"axial-trace-item"}
                  key={connection.id}
                  href={`/${projectId}/${axialCode.traceListId}/traces/${connection.traceId}`}
                >
                  <Card className="p-4 w-full mb-2" key={connection.id}>
                    <CardContent className={`p-0`}>
                      <p>{connection.trace?.openCode}</p>
                      <span className={"text-muted-foreground text-sm"}>
                        AI reasoning: {connection.reason}
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
