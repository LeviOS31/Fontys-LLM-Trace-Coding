"use client";

import { useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useJobStore } from "@/state/job";
import { Job } from "@/lib/types";

function hasPendingOutput(job: Job): boolean {
  return !!(job.metadata as Record<string, unknown>)?.pendingOutput;
}

/** Navigeer naar de review-pagina zodra een PROCESSING prompt COMPLETED wordt. */
export function RegenerationReviewRedirect() {
  const router = useRouter();
  const params = useParams();
  const traceListId = params.traceListId as string | undefined;
  const projectId = params.projectId as string | undefined;
  const jobs = useJobStore((s) => s.jobs);

  const redirected = useRef(new Set<string>());
  // Track which prompt IDs were PROCESSING at some point in this session
  const seenAsProcessing = useRef(new Set<string>());

  useEffect(() => {
    for (const job of jobs) {
      if (job.status === "PROCESSING") {
        seenAsProcessing.current.add(job.id);
      }
    }
  }, [jobs]);

  useEffect(() => {
    if (!traceListId || !projectId) return;

    for (const job of jobs) {
      // Only redirect for jobs we saw transition from PROCESSING in this session
      if (!seenAsProcessing.current.has(job.id)) continue;
      if (redirected.current.has(job.id)) continue;
      if (job.status !== "COMPLETED" || !hasPendingOutput(job)) continue;

      const meta = job.metadata as Record<string, unknown>;
      if (meta?.traceListId !== traceListId) continue;

      redirected.current.add(job.id);
      router.push(`/${projectId}/${traceListId}/axial-codes/review/${job.id}`);
    }
  }, [jobs, traceListId, projectId, router]);

  return null;
}
