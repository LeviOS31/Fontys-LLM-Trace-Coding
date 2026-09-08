"use server";

import { cookies } from "next/headers";

export async function toggleMinimized(minimized: boolean) {
  const cookieStore = await cookies();

  cookieStore.set("tree-view-minimized", String(minimized));
}
