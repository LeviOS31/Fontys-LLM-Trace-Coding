import { Job } from "@/lib/types";
import { create } from "zustand";

interface JobState {
  jobs: Job[];
  setJobs: (jobs: Job[]) => void;
  updateJob: (job: Job) => void;
  addJob: (job: Job) => void;
  removeJob: (jobId: string) => void;
  pendingReviewJob: Job | null;
  setPendingReviewJob: (job: Job | null) => void;
}

export const useJobStore = create<JobState>()((set) => ({
  jobs: [],
  setJobs: (jobs) => set({ jobs }),
  addJob: (job) =>
    set((state) => ({
      jobs: state.jobs.some((j) => j.id === job.id)
        ? state.jobs
        : [...state.jobs, job],
    })),
  updateJob: (updatedJob) =>
    set((state) => ({
      jobs: state.jobs.map((j) => (j.id === updatedJob.id ? updatedJob : j)),
    })),
  removeJob: (id) =>
    set((state) => ({
      jobs: state.jobs.filter((j) => j.id !== id),
    })),
  pendingReviewJob: null,
  setPendingReviewJob: (job) => set({ pendingReviewJob: job }),
}));
