import AxialCodeSectionCards from "@/components/axial-code/axial-code-section-cards";
import ClientPage from "./page.client";

export default async function Page({
  params,
}: {
  params: Promise<{ projectId: string; traceListId: string; trace: string }>;
}) {
  const { traceListId } = await params;
  return (
    <div className="w-full h-full flex flex-col gap-4">
      <AxialCodeSectionCards traceListId={traceListId} />
      <ClientPage />
    </div>
  );
}
