"use server";
import { revalidatePath } from "next/cache";
import { client } from "@/lib/utils";
import { cookies } from "next/headers";

export async function addProject({
  name,
  description,
}: {
  name: string;
  description: string;
}) {
  const { data, error } = await client.projects.post({
    name: name.trim(),
    description: description.trim(),
  });

  if (error) {
    return new Error(error.value.message);
  }

  revalidatePath("/");
  return data;
}

export async function updateProject({
  id,
  name,
  description,
}: {
  id: string;
  name: string;
  description: string;
}) {
  const { data, error } = await client.projects({ id }).patch({
    name: name.trim(),
    description: description.trim(),
  });

  if (error) {
    return new Error(error.value.message);
  }

  revalidatePath("/");
  return data;
}

export async function deleteProject({ id }: { id: string }) {
  const { error } = await client.projects({ id }).delete();
  if (error) return error;

  revalidatePath("/");
  return;
}
export async function updateCriteria({
  id,
  assessmentCriteria,
}: {
  id: string;
  assessmentCriteria: string;
}) {
  const { error } = await client
    .projects({ id })
    .criteria.patch({ assessmentCriteria });
  if (error) return error;

  revalidatePath("/");
  return;
}

export async function deleteTracelist({
  traceListId,
}: {
  traceListId: string;
}) {
  const { error } = await client.lists({ traceListId }).delete();
  if (error) return error;
  revalidatePath("/");
}

export async function updateTracelist({
  traceListId,
  newName,
  axialCodeFeedback,
}: {
  traceListId: string;
  newName: string;
  axialCodeFeedback: string;
}) {
  const { error, data } = await client
    .lists({ traceListId })
    .patch({ newName: newName, axialCodeFeedback: axialCodeFeedback });
  if (error) return error;


  revalidatePath("/");
}

export async function importTraceList(file: File, projectId: string) {
  try {
    const { data, error } = await client.lists.import.post({
      export: file,
      projectId,
    });

    if (error) {
      console.error("Import API error:", error);
      return { success: false, error: error || "Import failed" };
    }

    return data;
  } catch (err) {
    console.error("Server action error:", err);
    return { success: false, error: "Unexpected server error" };
  }
}

export async function updateTracelistIndexView(newView: string) {
  const actionCookies = await cookies();
  actionCookies.set("tracelist-index-view", newView);
  revalidatePath("/[projectId]");
}
