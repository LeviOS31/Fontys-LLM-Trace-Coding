"use server";

import { client } from "@/lib/utils";

export async function updatePromptAction({
  promptId,
  text,
}: {
  promptId: string;
  text: string;
}) {
  const { data, error } = await client.prompt({ promptId }).patch({ text });

  if (error) {
    return new Error(error.value.message);
  }

  return data;
}

export async function resetPromptAction({ promptId }: { promptId: string }) {
  const { data, error } = await client.prompt({ promptId }).reset.patch();

  if (error) {
    return new Error(error.value.message);
  }

  return data;
}
