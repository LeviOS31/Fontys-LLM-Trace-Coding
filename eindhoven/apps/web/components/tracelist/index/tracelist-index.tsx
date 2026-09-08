"use client";
import { FileWarningIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { TracelistInfo } from "@/lib/types";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import TracelistIndexCards from "@/components/tracelist/index/tracelist-index-cards";
import TracelistIndexTable from "@/components/tracelist/index/tracelist-index-table";
function StatusIndicator({
  filteredTraceLists,
}: {
  filteredTraceLists: TracelistInfo[];
}) {
  return (
    <div
      className={
        "flex bg-card rounded-xl px-3 py-2 items-center flex-row gap-4 justify-center h-max"
      }
    >
      <div>
        <p>Project status</p>
        <p className={"text-3xl"}>
          {filteredTraceLists.filter((f) => f.status.pending > 0).length} to-do,{" "}
          {filteredTraceLists.filter((f) => f.status.pending == 0).length}{" "}
          completed
        </p>
      </div>
    </div>
  );
}

function AveragePositive({
  filteredTraceLists,
}: {
  filteredTraceLists: TracelistInfo[];
}) {
  const avgPositive = useMemo(() => {
    const candidates = filteredTraceLists.filter(
      (d) => d.status.positive > 0 || d.status.negative > 0,
    );

    return Number(
      (
        candidates
          .map(
            (f) =>
              (f.status.positive / (f.status.positive + f.status.negative)) *
              100,
          )
          .reduce((a, b) => a + b, 0) / candidates.length
      ).toFixed(2),
    );
  }, [filteredTraceLists]);

  return (
    <div className={"flex items-center flex-row gap-4 justify-center h-max"}>
      <div>
        <p>Approval rate</p>
        <p className={"text-3xl"}>
          {isNaN(avgPositive) ? "N/A" : avgPositive + "%"}
        </p>
      </div>
    </div>
  );
}

export default function TracelistIndex({
  data,
  view,
}: {
  data: TracelistInfo[];
  view: string;
}) {
  const [displayFilter, setDisplayFilter] = useState<string>("all");

  const [keywordSearchFilter, setKeywordSearchFilter] = useState<string>("");

  const filteredTraceLists = useMemo(
    () =>
      data
        .filter((d) => {
          switch (displayFilter) {
            case "all":
              return true;
            case "completed":
              return d.status.pending == 0;
            case "progress":
              return (
                d.status.pending > 0 &&
                (d.status.positive > 0 || d.status.negative > 0)
              );
            case "todo":
              return (
                d.status.pending > 0 &&
                d.status.positive == 0 &&
                d.status.negative == 0
              );
          }
        })
        .filter((d) =>
          d.name.toLowerCase().includes(keywordSearchFilter.toLowerCase()),
        )
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
    [displayFilter, data, keywordSearchFilter],
  );

  const projectId = useParams().projectId;

  return (
    <div className={"overflow-auto"}>
      <div className={"flex flex-row gap-5"}>
        {data.length == 0 && (
          <Empty data-testid="empty-tracelists-container" className={"h-full"}>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileWarningIcon />
              </EmptyMedia>
              <EmptyTitle data-testid="empty-tracelists-label">
                This project does not contain any tracelists.
              </EmptyTitle>
              <EmptyDescription>
                You haven&apos;t uploaded any traces yet.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="flex-row justify-center gap-2">
              <Link href={`/${projectId}/upload`}>
                <Button>Upload</Button>
              </Link>
            </EmptyContent>
          </Empty>
        )}

        <div className={`h-full grow text-xs ${data.length == 0 && "hidden"}`}>
          <div
            className={
              "flex items-center flex-row mb-4 px-4 border-b pb-4 gap-8"
            }
          >
            <AveragePositive filteredTraceLists={data} />
            <StatusIndicator filteredTraceLists={data} />
          </div>

          <div className={"flex flex-col gap-2 mb-2"}>
            <div className={"flex mb-2 gap-2"}>
              <Input
                data-testid="search-input"
                disabled={data.length == 0}
                onChange={(e) => setKeywordSearchFilter(e.target.value)}
                type="text"
                id="keyword-search"
                className={"max-w-50"}
                placeholder={"Keyword"}
              ></Input>

              <ToggleGroup
                type={"single"}
                disabled={data.length == 0}
                onValueChange={(v) => setDisplayFilter(v)}
                variant={"outline"}
              >
                <ToggleGroupItem value={"all"}>All</ToggleGroupItem>
                <ToggleGroupItem value={"completed"}>Completed</ToggleGroupItem>
                <ToggleGroupItem value={"progress"}>
                  In progress
                </ToggleGroupItem>
                <ToggleGroupItem value={"todo"}>To-do</ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
          {view == "grid" ? (
            <TracelistIndexCards filteredTracelists={filteredTraceLists} />
          ) : (
            <TracelistIndexTable filteredTracelists={filteredTraceLists} />
          )}
        </div>
      </div>
    </div>
  );
}
