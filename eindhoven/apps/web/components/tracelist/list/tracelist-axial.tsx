"use client";

import { generateAxialCodes } from "@/app/[projectId]/[traceListId]/axial-codes/actions";
import { Button } from "@/components/ui/button";
import { useLoadingContext } from "@/components/loading-context";
import { HeaderActions } from "@/components/header-actions";
import Link from "next/link";
import { useAxialStore } from "@/state/axial";
import { useJobStore } from "@/state/job";
import { useJobPolling } from "@/lib/job";
import { toast } from "sonner";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { cancelJob } from "@/lib/job-utils";
import OverwriteCurrentDialog from "@/components/axial-code/overwrite-current-dialog";
import OverwriteJobDialog from "@/components/axial-code/overwrite-job-dialog";

export default function TracelistAxial({
  traceListId,
  projectId,
}: {
  traceListId: string;
  projectId: string;
  todoCount: number;
  traceListLength: number;
}) {
  const router = useRouter();
  const axialCodes = useAxialStore((s) => s.axialCodes);
  const setAxialCodes = useAxialStore((s) => s.setAxialCodes);
  const addJob = useJobStore((s) => s.addJob);
  const jobs = useJobStore((s) => s.jobs);

  useJobPolling(traceListId);

  const runningJob = useMemo(() => {
    return jobs.find((j) => j.status === "PROCESSING");
  }, [jobs]);

  async function handleReset(){
    if (!runningJob) return;
    await cancelJob(runningJob.id)
    handleAction()
  }

  async function handleAction() {
    try {
      const job = await generateAxialCodes(traceListId);
      setAxialCodes([]);
      addJob(job);
      toast.success("Axial code generation started");
      router.push(`/${projectId}/${traceListId}/axial-codes`);
    } catch (error) {
      console.error(error);
      toast.error("Error generating tracelist");
    }
  }

  return (
    <>
      <HeaderActions>
        {axialCodes && axialCodes?.length > 0 && (
          <Link href={`/${projectId}/${traceListId}/axial-codes`}>
            <Button>View axial codes</Button>
          </Link>
        )}
      </HeaderActions>
      {runningJob ?
        (<OverwriteJobDialog overwriteAction={handleReset}/>) :
        (axialCodes && axialCodes.length > 0 ?
          (<OverwriteCurrentDialog handleAction={handleAction}/>): (
        <Button
          onClick={handleAction}
          type="submit"
          className={`mx-8 my-4`}
          data-testid={"generate-button"}
        >
          Generate
        </Button>
      ))}
    </>
  );
}
