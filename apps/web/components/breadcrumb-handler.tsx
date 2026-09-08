"use client";

import { useTraceStore } from "@/state/trace";
import { useProjectStore } from "@/state/project";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList, BreadcrumbPage,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {useJobStore} from "@/state/job";
import {useAxialStore} from "@/state/axial";
import {Skeleton} from "@/components/ui/skeleton";

export default function BreadcrumbHandler() {
    const crumbs = usePathname().split("/").filter(s => s != "")

    const project = useProjectStore((s) => s.project);
    const traceList = useTraceStore((s) => s.traceList);
    const jobs = useJobStore(j => j.jobs)
    const axialCodes = useAxialStore(a => a.axialCodes)

    function replaceWithName(piece: string){
        switch (piece) {
            case project?.id:
                return (!project || project?.name == "") ? "Untitled project" : project.name
            case traceList?.id:
                return (!traceList || traceList.name == "") ? "Untitled tracelist" : traceList.name
        }

        if (jobs.findIndex(j => j.id == piece) != -1){
            return "Job"
        }

        const axial = axialCodes?.find(a => a.id == piece)
        if (axial){
            return axial.title
        }

        const trace = traceList?.traces.find(t => t.id == piece)
        if (trace){
            return trace.name ?? "Untitled trace"
        }

        if (/^[0-9a-f-]{36}$/.test(piece)) return null;

        return piece.replaceAll("-", " ")
    }

    function buildUrl(index: number){
        let result = "/"
        for (let i = 0; i < index + 1; i++){
            result += crumbs[i] + "/"
        }
        return result
    }

  return (
      <Breadcrumb>
          <BreadcrumbList>
              <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                      <Link className={"capitalize"} href={"/"}>Home</Link>
                  </BreadcrumbLink>
              </BreadcrumbItem>
              {crumbs.map((r, i) => {
                  const n = replaceWithName(r)
                  return n ? (
                      <div className={"contents"} key={i}>
                          <BreadcrumbSeparator/>
                          <BreadcrumbItem>
                              <BreadcrumbLink asChild>
                                  <Link className={"capitalize"} href={buildUrl(i)}>{n}</Link>
                              </BreadcrumbLink>
                          </BreadcrumbItem>
                      </div>
                  ) : (
                      <div className={"contents"} key={i}>
                          <BreadcrumbSeparator/>
                          <Skeleton key={i}>
                              <BreadcrumbPage className="opacity-0 pointer-events-none w-20">
                                  Skeleton
                              </BreadcrumbPage>
                          </Skeleton>
                      </div>
                  )
              })}
          </BreadcrumbList>
      </Breadcrumb>
  );
}
