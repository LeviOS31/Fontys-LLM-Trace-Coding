import { Button } from "@/components/ui/button";
import { getTraceListExportData } from "@/app/[projectId]/[traceListId]/actions";
import { toast } from "sonner";
import { DownloadIcon } from "lucide-react";

export default function TracelistExport({
  traceListId,
}: {
  traceListId: string;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="px-3"
      onClick={async () => {
        const traceListData = await getTraceListExportData(traceListId);
        if (!traceListData.success) {
          return toast.error("Failed to export data", {
            description: traceListData.message,
          });
        }

        const dl = document.createElement("a");
        const blob = new Blob([JSON.stringify(traceListData?.data, null, 2)], {
          type: "application/json",
        });
        dl.download = `tracelist-export.json`;
        dl.href = URL.createObjectURL(blob);
        dl.click();
      }}
    >
      <DownloadIcon />
      Export
    </Button>
  );
}
