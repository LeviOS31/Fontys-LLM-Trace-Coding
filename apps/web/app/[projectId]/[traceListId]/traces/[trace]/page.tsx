import { cookies } from "next/headers";

import { client } from "@/lib/utils";
import ClientPage from "./page.client";

export default async function Page({
  params,
}: {
  params: Promise<{ projectId: string; traceListId: string; trace: string }>;
}) {
  const { trace: traceId } = await params;

  const { data, error } = await client.traces({ traceId }).get();

  const parsedError = error
    ? {
        status: error?.status || "Unknown Error",
        message: error?.value?.message || "An unknown error occurred",
      }
    : undefined;

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Trace not found.</p>
      </div>
    );
  }

  const cookieStore = await cookies();
  const aiSuggestionsEnabled =
    cookieStore.get("aiSuggestions")?.value === "true";
  const traceTreeViewMinimized =
    cookieStore.get("tree-view-minimized")?.value === "true";

  return (
    <ClientPage
      trace={data}
      error={parsedError}
      aiSuggestionsEnabled={aiSuggestionsEnabled}
      traceTreeViewMinimized={traceTreeViewMinimized}
    />
  );
}
