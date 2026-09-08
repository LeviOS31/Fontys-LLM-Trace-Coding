"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

import { useTraceStore } from "@/state/trace";

export default function Page() {
  const params = useParams<{ projectId: string; traceListId: string }>();
  const nextTrace = useTraceStore((s) => s.nextTrace);
  const router = useRouter();

  useEffect(() => {
    if (!params?.projectId || !params?.traceListId) {
      return;
    }
    const { projectId, traceListId } = params;

    if (nextTrace) {
      router.push(`/${projectId}/${traceListId}/traces/${nextTrace}`);
    }
  }, [nextTrace, params, router]);

  return (
    <>
      <div className="flex justify-center items-center w-full h-full">
        <span className="text-xl">Please select a trace.</span>
      </div>
    </>
  );
}
