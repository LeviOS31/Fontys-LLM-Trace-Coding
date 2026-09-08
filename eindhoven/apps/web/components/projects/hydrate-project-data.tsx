"use client";

import { Project } from "@/lib/types";
import { useEffect } from "react";
import { useProjectStore } from "@/state/project";

interface Props {
  project: Project;
}

export default function HydrateProjectData(props: Props) {
  const setProject = useProjectStore((s) => s.setProject);

  useEffect(() => {
    setProject(props.project);
  }, [props.project, setProject]);

  return null;
}
