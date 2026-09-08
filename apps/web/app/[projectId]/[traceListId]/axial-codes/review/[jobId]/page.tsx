import { RegenerationReviewLoader } from "@/components/regeneration-review-loader";

export default async function RegenerationReviewPage({
  params,
}: {
  params: Promise<{ projectId: string; traceListId: string; jobId: string }>;
}) {
  const { projectId, traceListId, jobId } = await params;

  return (
    <RegenerationReviewLoader
      jobId={jobId}
      projectId={projectId}
      traceListId={traceListId}
    />
  );
}
