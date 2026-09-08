"use client"

import { useJobStore } from "@/state/job";
import { useTraceStore } from "@/state/trace";
import { useAxialStore } from "@/state/axial";
import { useProjectStore } from "@/state/project";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function StoreResetter() {
  const page = usePathname()

  const jobs = useJobStore(s => s.setJobs)
  const axial = useAxialStore(a => a.setAxialCodes)
  const traceList = useTraceStore(s => s.setTraceList)
  const project = useProjectStore(s => s.setProject)

  function reset(){
    jobs([]);
    axial([]);
    traceList(null);
    project(null);
  }
  
  useEffect(() => {
    if (!page.startsWith("/settings") && page != "/"){
      return
    }
    reset()
  }, [page]);

  return null;
}