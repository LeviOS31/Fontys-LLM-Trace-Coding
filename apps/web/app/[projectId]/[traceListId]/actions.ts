"use server";

import { client } from "@/lib/utils";

export async function getTraceListExportData(traceListId: string) {
  const { data, error } = await client.lists({ traceListId }).export.get();

  if (error) {
    return {
      success: false,
      message: error.value.message,
    };
  }

  return {
    success: true,
    data,
  };
}
