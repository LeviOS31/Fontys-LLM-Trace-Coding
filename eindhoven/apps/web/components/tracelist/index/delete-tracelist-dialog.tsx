"use client";

import { deleteTracelist } from "@/app/[projectId]/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Trash, TriangleAlertIcon, ArrowUpLeft } from "lucide-react";
import { toast } from "sonner";
import { TracelistInfo } from "@/lib/types";

export default function DeleteTracelistDialog({
  traceList,
  compact = false,
}: {
  traceList: TracelistInfo;
  compact?: boolean;
}) {
  async function deleteList() {
    const error = await deleteTracelist({ traceListId: traceList.id });

    if (error) {
      toast.error("Failed to delete tracelist.");
      return;
    }

    toast.success("Deleted tracelist.");
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size={compact ? "icon-sm" : "default"}
          type={"button"}
          variant={"ghost"}
          className={
            "justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          }
        >
          <Trash size={compact ? 10 : 14} />
          {compact ? "" : "Delete"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
          <DialogDescription>
            The tracelist will be gone forever. This cannot be undone!
          </DialogDescription>
        </DialogHeader>
        <div className={"flex flex-row mt-2 gap-2 justify-end"}>
          <DialogClose asChild>
            <Button variant={"outline"}>
              <ArrowUpLeft />
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={deleteList} variant={"destructive"}>
            <TriangleAlertIcon />
            Yes, i am sure
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
