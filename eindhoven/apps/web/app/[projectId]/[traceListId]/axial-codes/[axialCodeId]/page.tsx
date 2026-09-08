"use client";

import { useParams } from "next/navigation";

import { useAxialStore } from "@/state/axial";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import JudgeView from "@/components/axial-code/judge-template-view";
import AxialCodeView from "@/components/axial-code/axial-code-view";
import AxialCodeDetails from "@/components/axial-code/axial-code-details";

export default function Page() {
  const params = useParams<{
    projectId: string;
    traceListId: string;
    axialCodeId: string;
  }>();
  const axialCodes = useAxialStore((s) => s.axialCodes);

  if (!axialCodes) return;

  const selectedAxialCode = axialCodes.find((c) => c.id === params.axialCodeId);

  if (!selectedAxialCode) return null;

  return (
    <div className="w-full space-y-5 h-full flex flex-col">
      <div className="h-fit">
        <AxialCodeDetails axialCode={selectedAxialCode} />
      </div>

      <div className="flex-1 min-h-0">
        <Tabs defaultValue="regeneration" className="w-full h-full">
          <TabsList>
            <TabsTrigger value="regeneration">Regeneration</TabsTrigger>
            <TabsTrigger value="judge">LLM-as-a-judge</TabsTrigger>
          </TabsList>
          <TabsContent value="regeneration">
            <AxialCodeView
              projectId={params.projectId}
              axialCode={selectedAxialCode}
            />
          </TabsContent>
          <TabsContent value="judge">
            <JudgeView axialCodeId={params.axialCodeId!} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
