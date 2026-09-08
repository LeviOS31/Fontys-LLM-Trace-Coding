"use client";

import { useJobStore } from "@/state/job";
import { useEffect } from "react";
import { getActiveJobs, getJob } from "@/lib/job-utils";
import { useAxialStore } from "@/state/axial";
import { client } from "@/lib/utils";

export function useJobPolling(traceListId: string) {
  const jobs = useJobStore((s) => s.jobs);
  const setJobs = useJobStore((s) => s.setJobs);
  const updateJob = useJobStore((s) => s.updateJob);
  const setAxialCodes = useAxialStore((s) => s.setAxialCodes);

  useEffect(() => {
    getActiveJobs().then(setJobs);
  }, [setJobs]);

  useEffect(() => {
    const processingJobs = jobs.filter((job) => job.status === "PROCESSING");

    if (processingJobs.length === 0) return;

    const interval = setInterval(async () => {
      for (const job of processingJobs) {
        try {
          const updatedJob = await getJob(job.id);

          if (updatedJob.status !== "PROCESSING") {
            updateJob(updatedJob);

            const { data: newCodes } = await client
              .axial({ traceListId })
              .get({ query: { t: Date.now() } });
            if (newCodes) setAxialCodes(newCodes);
          }
        } catch (e) {
          console.error(`Failed to fetch job ${job.id}:`, e);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [jobs, updateJob]);
}
