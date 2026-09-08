"use client";

import dynamic from "next/dynamic";

const JobReviewDialog = dynamic(
  () => import("@/components/job-review-dialog"),
  {
    ssr: false,
  },
);

export function JobReviewProvider() {
  return <JobReviewDialog />;
}
