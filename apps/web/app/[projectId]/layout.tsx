import { client } from "@/lib/utils";
import HydrateProjectData from "@/components/projects/hydrate-project-data";

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ projectId: string }>;
  children: React.ReactNode;
}) {
  const { projectId: id } = await params;
  const { data, error } = await client.projects({ id }).get();

  if (!data && error) {
    return null;
  }

  return (
    <>
      {children}
      <HydrateProjectData project={data} />
    </>
  );
}
