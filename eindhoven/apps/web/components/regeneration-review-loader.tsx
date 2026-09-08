"use client";

import { useEffect, useRef, useState } from "react";
import { useJobStore } from "@/state/job";
import { getJob } from "@/lib/job-utils";
import { Job } from "@/lib/types";
import RegenerationReviewV2 from "@/components/regeneration-review-v2";

function hasPendingOutput(job: Job): boolean {
  return !!(job.metadata as Record<string, unknown>)?.pendingOutput;
}

export function RegenerationReviewLoader({
  jobId,
  projectId,
  traceListId,
}: {
  jobId: string;
  projectId: string;
  traceListId: string;
}) {
  const storeJob = useJobStore((s) => s.jobs.find((j) => j.id === jobId));
  const [fetchedJob, setFetchedJob] = useState<Job | null>(null);
  const [error, setError] = useState(false);
  const sawStoreJobRef = useRef(false);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (storeJob) {
      sawStoreJobRef.current = true;
      return;
    }
    if (sawStoreJobRef.current || hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    getJob(jobId)
      .then(setFetchedJob)
      .catch(() => setError(true));
  }, [jobId, storeJob]);

  const job = storeJob ?? fetchedJob;

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Job niet gevonden.
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Laden…
      </div>
    );
  }

  if (job.status !== "COMPLETED" || !hasPendingOutput(job)) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Geen wijzigingen om te reviewen.
      </div>
    );
  }

  return (
    <RegenerationReviewV2
      job={job}
      projectId={projectId}
      traceListId={traceListId}
    />
  );
}
