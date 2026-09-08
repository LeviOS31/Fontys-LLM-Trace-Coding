import { redirect } from "next/navigation";

export default async function Page({
  params,
}: {
  params: Promise<{ projectId: string; traceListId: string }>;
}) {
  const { projectId, traceListId } = await params;

  redirect(`/${projectId}/${traceListId}/traces`);
}
