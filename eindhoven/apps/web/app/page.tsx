import { client } from "@/lib/utils";
import { ProjectsView } from "@/components/projects/projects-view";
import { Project } from "@/lib/types";

export default async function ProjectsPage() {
  const { data } = await client.projects.get();
  const projects = (data as Project[]) ?? [];

  return <ProjectsView initialProjects={projects} />;
}
