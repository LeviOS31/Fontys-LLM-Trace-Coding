import { NextResponse } from "next/server";
import { client } from "@/lib/utils";

export async function GET() {
  const { data } = await client.status.ai.get();

  return NextResponse.json(data);
}
