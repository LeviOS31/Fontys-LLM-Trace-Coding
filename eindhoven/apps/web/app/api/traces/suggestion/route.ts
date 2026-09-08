import { NextRequest, NextResponse } from "next/server";
import { client } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const { currentTrace, nextTrace } = body;

  const { data } = await client.traces.suggestion.post({
    currentTrace,
    nextTrace: nextTrace ?? undefined,
  });

  if (!data) {
    return NextResponse.json(
      { error: "Something went wrong trying to get a suggestion" },
      { status: 500 },
    );
  }

  return NextResponse.json(data);
}
