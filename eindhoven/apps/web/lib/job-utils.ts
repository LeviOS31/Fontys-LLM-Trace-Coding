"use server";

import { client } from "@/lib/utils";
import { Job } from "@/lib/types";
import {useJobStore} from "@/state/job";

export async function watchActiveJobs() {
  const response = await client.jobs.get();

  const { data, error } = response;

  if (error) {
    console.error(JSON.stringify(error, null, 2));
    throw error;
  }

  return data.filter((job: Job) => {
    return job.status === "PROCESSING";
  });
}

function hasPendingOutput(job: Job): boolean {
  return !!(job.metadata as Record<string, unknown>)?.pendingOutput;
}

export async function getActiveJobs() {
  const response = await client.jobs.get();

  const { data, error } = response;

  if (error) {
    console.error(JSON.stringify(error, null, 2));
    throw error;
  }

  return data.filter((job: Job) => {
    return (
      job.status === "PROCESSING" ||
      (job.status === "COMPLETED" && hasPendingOutput(job))
    );
  });
}

export async function getJob(jobId: string) {
  const response = await client.jobs({ jobId }).get();

  const { data, error } = response;

  if (error) {
    console.error(JSON.stringify(error, null, 2));
    throw error;
  }

  return data;
}

export async function cancelJob(jobId: string) {
  const response = await client.jobs({jobId}).cancel.patch();

  const {data, error} = response;

  if (error) {
    console.error(JSON.stringify(error, null, 2));
    throw error;
  }

  return data;
}
