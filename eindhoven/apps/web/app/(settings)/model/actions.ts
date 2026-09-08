"use server";

import { client } from "@/lib/utils";

export async function changeModel(model: string) {
  const { data } = await client.settings.model.put({ model });
  return data;
}
