"use server";

import { revalidatePath } from "next/cache";

import { client } from "@/lib/utils";

const allowedFileTypes = ["text/csv", "application/json;charset=utf-8"];

export interface InitialState {
  error: string | undefined;
}

export async function upload(
  initialState: InitialState | undefined,
  formData: FormData,
) {
  const file = formData.get("file") as File;
  const type = formData.get("type") as string;
  const projectId = formData.get("projectId") as string;

  if (!file || !allowedFileTypes.includes(file.type) || !type)
    return {
      success: false,
      error: "No file uploaded or filetype not allowed.",
    };

  const { data, error } = await client.files.post({ file, type, projectId });

  if (error) {
    return {
      traceListId: false,
      error: error.value?.message ?? "Upload failed",
    };
  }

  if (!("traces" in data) || !("traceListId" in data)) {
    return {
      traceListId: false,
      error: data.message,
    };
  }

  revalidatePath("/[projectId]/upload");

  return {
    success: data.traces > 0,
    traceListId: data.traceListId,
    error: "",
  };
}

export async function probe(buffer: Uint8Array) {
  const { data, error } = await client.files.probe.post({
    buffer: Array.from(buffer),
  });

  if (error) {
    return {
      error: error.value?.message ?? "Probe failed",
    };
  }

  return {
    data,
  };
}
