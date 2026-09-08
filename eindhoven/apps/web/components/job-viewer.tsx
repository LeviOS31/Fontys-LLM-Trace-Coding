"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { CircleCheck, CircleX, Clock, Eye } from "lucide-react";
import { useJobStore } from "@/state/job";
import { useJobPolling } from "@/lib/job";
import { Job, asRegenerateMetadata } from "@/lib/types";
import { useParams, useRouter } from "next/navigation";
import {cancelJob} from "@/lib/job-utils";

function hasPendingOutput(job: Job): boolean {
  return asRegenerateMetadata(job.metadata) !== null;
}

export default function JobViewer() {
  const params = useParams();
  const router = useRouter();
  const updateJob = useJobStore(s => s.updateJob)
  const projectId = params.projectId as string;
  const traceListId = params.traceListId as string;

  function handleCancelJob(jobId: string) {
    cancelJob(jobId)
      .then((res) => updateJob(res))
      .catch((err) => console.error(err));
  }

  useJobPolling(traceListId);
  const jobs = useJobStore((s) => s.jobs);

  const reviewableJobs = jobs.filter(
    (j) => j.status === "COMPLETED" && hasPendingOutput(j),
  );
  const otherJobs = jobs.filter(
    (j) => !(j.status === "COMPLETED" && hasPendingOutput(j)),
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant={reviewableJobs.length > 0 ? "default" : "outline"}
        >
          {jobs.length}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          {reviewableJobs.length > 0 && (
            <>
              <DropdownMenuLabel>Pending review</DropdownMenuLabel>
              {reviewableJobs.map((job: Job) => (
                <DropdownMenuItem
                  key={job.id}
                  className="flex flex-row items-center justify-between gap-2 p-2 cursor-pointer"
                  onSelect={() => {
                    const regenMeta = asRegenerateMetadata(job.metadata);
                    const jobTraceListId =
                      regenMeta?.traceListId ?? traceListId;
                    router.push(
                      `/${projectId}/${jobTraceListId}/axial-codes/review/${job.id}`,
                    );
                  }}
                >
                  <div className="flex items-center gap-2">
                    <CircleCheck size={20} fill="#bbf7d1" color="#00c951" />
                    <span className="text-sm">Regeneration complete</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Eye size={12} />
                    Review
                  </div>
                </DropdownMenuItem>
              ))}
              {otherJobs.length > 0 && <DropdownMenuSeparator />}
            </>
          )}

          {otherJobs.length > 0 && (
            <>
              <DropdownMenuLabel>Active jobs</DropdownMenuLabel>
              {otherJobs.map((job: Job) => (
                <DropdownMenuItem
                  key={job.id}
                  className="flex flex-row items-center gap-2 p-2"
                >
                  {getStatusIcon(job.status)}
                  {job.status.charAt(0).toUpperCase() + job.status.slice(1).toLowerCase()}
                  {job.status == "FAILED" && <p>- Reason: {String(job.metadata["reason"] ?? "")}</p>}
                  {job.status == "PROCESSING" && <Button
                      size={"xs"}
                      variant={"ghost"}
                      className={"ml-auto"}
                      onClick={() => handleCancelJob(job.id)}
                  >
                      Cancel
                  </Button>}
                </DropdownMenuItem>
              ))}
            </>
          )}

          {jobs.length === 0 && (
            <DropdownMenuItem disabled>
              <p className="text-sm text-muted-foreground">No active jobs</p>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function getStatusIcon(status: string) {
  const color = () => {
    switch (status) {
      case "PROCESSING":
        return "#fbbf24";
      case "COMPLETED":
        return "#00c951";
      case "FAILED":
        return "#ff4d4d";
      default:
        return "#000000";
    }
  };

  const fill = () => {
    switch (status) {
      case "PROCESSING":
        return "#fef3c7";
      case "COMPLETED":
        return "#bbf7d1";
      case "FAILED":
        return "#ffcccc";
      default:
        return "#ffffff";
    }
  };

  switch (status) {
    case "PROCESSING":
      return <Clock size={20} fill={fill()} color={color()} />;
    case "COMPLETED":
      return <CircleCheck size={20} fill={fill()} color={color()} />;
    case "FAILED":
      return <CircleX size={20} fill={fill()} color={color()} />;
    default:
      return null;
  }
}
