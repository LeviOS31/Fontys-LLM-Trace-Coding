"use server";
import { revalidatePath } from "next/cache";
import { client } from "@/lib/utils";
import { TracesModel } from "@repo/api/modules/traces/model";
import { cookies } from "next/headers";

export async function saveTrace({
  traceId,
  feedback,
  openCode,
  isFlagged,
}: {
  traceId: string;
  feedback: TracesModel.Feedback | null;
  openCode?: string;
  isFlagged: boolean;
}) {
  const { error } = await client.traces({ traceId }).post({
    feedback,
    openCode,
    isFlagged,
  });

  if (error) {
    throw new Error(error.value.message);
  }

  revalidatePath("/[projectId]/[traceListId]/traces/[trace]");
}

export async function updateDetailed(detailed: boolean) {
  const actionCookies = await cookies();
  actionCookies.set("detailed-view", String(detailed));
  revalidatePath("/[projectId]/[traceListId]/traces/[trace]");
}

export async function toggleAiSuggestions(enabled: boolean) {
  const cookieStore = await cookies();
  cookieStore.set("aiSuggestions", String(enabled));
}
