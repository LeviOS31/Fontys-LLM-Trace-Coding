"use server";

import { client } from "@/lib/utils";
import { Job } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function generateAxialCodes(traceListId: string): Promise<Job> {
  const response = await client.axial({ traceListId }).post();

  const { data, error } = response;

  if (error) {
    throw new Error(`Failed to generate axial code: ${error}`);
  }

  if (response.status === 202 && data) {
    revalidatePath("/[projectId]/[traceListId]/axial-codes");
    return data;
  }

  throw new Error("Unable to generate axial code");
}

export async function regenerateAxialCodes(traceListId: string): Promise<Job> {
  const response = await client.axial({ traceListId }).regenerate.post();

  const { data, error } = response;

  if (error) {
    throw new Error(`Failed to regenerate axial code: ${error}`);
  }

  if (response.status === 202 && data) {
    return data;
  }

  throw new Error("Unable to regenerate axial code");
}

export async function updateAxialCode({
  traceListId,
  axialCodeId,
  title,
  description,
  feedback,
}: {
  traceListId: string;
  axialCodeId: string;
  title: string;
  description: string;
  feedback: string;
}) {
  const { error } = await client.axial({ traceListId })({ axialCodeId }).patch({
    title,
    description,
    feedback,
  });

  if (error) {
    throw new Error(error.value.message);
  }
  revalidatePath("/[projectId]/[traceListId]/axial-codes/[axialCodeId]");
}

export async function getAxialCodes(traceListId: string) {
  const { data, error } = await client.axial({ traceListId }).get();

  if (error) {
    throw new Error(error.value.message);
  }

  return data;
}

export async function acceptRegeneration(
  traceListId: string,
  jobId: string,
): Promise<void> {
  const { error } = await client
    .axial({ traceListId })
    .accept({ jobId })
    .post();
  if (error) throw new Error("Failed to accept regeneration");
}

export async function rejectRegeneration(
  traceListId: string,
  jobId: string,
): Promise<void> {
  const { error } = await client
    .axial({ traceListId })
    .reject({ jobId })
    .post();
  if (error) throw new Error("Failed to reject regeneration");
}
