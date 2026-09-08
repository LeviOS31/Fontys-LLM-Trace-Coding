import { HeaderActions } from "@/components/header-actions";
import { Button } from "@/components/ui/button";
import { client } from "@/lib/utils";
import { LayoutGrid, Settings2, Table2, UploadIcon } from "lucide-react";
import Link from "next/link";
import { ButtonGroup } from "@/components/ui/button-group";
import CriteriaPopover from "@/components/assessment-criteria/criteria-popover";
import { cookies } from "next/headers";
import { updateTracelistIndexView } from "@/app/[projectId]/actions";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TracelistIndex from "@/components/tracelist/index/tracelist-index";
import ImportFileModal from "@/components/tracelist/import-modal";

export default async function Page({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { data } = await client.projects({ id: projectId }).tracelists.get();

  const cookieStore = await cookies();
  const traceListView =
    cookieStore.get("tracelist-index-view")?.value ?? "grid";

  return (
    <>
      {(data ?? []).length > 0 && (
        <HeaderActions>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings2 />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56">
              <p className="text-sm font-medium mb-2">View</p>
              <Tabs
                value={traceListView}
                onValueChange={updateTracelistIndexView}
              >
                <TabsList className="w-full">
                  <TabsTrigger value="grid" className="flex-1">
                    <LayoutGrid />
                    Grid
                  </TabsTrigger>
                  <TabsTrigger value="table" className="flex-1">
                    <Table2 />
                    List
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="list" />
              </Tabs>
            </PopoverContent>
          </Popover>
          <CriteriaPopover />
          <ButtonGroup>
            <Button
              className={"justify-center items-center"}
              type={"button"}
              variant="outline"
              asChild
            >
              <Link href={`${projectId}/upload`}>
                <UploadIcon />
                Upload
              </Link>
            </Button>
            <ImportFileModal projectId={projectId} />
          </ButtonGroup>
        </HeaderActions>
      )}
      <TracelistIndex data={data ?? []} view={traceListView ?? "table"} />
    </>
  );
}
