"use client";

import { updateTracelist } from "@/app/[projectId]/actions";
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
import { Input } from "@/components/ui/input";
import { LucideTextCursorInput, LucideSave, ArrowUpLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { TracelistInfo } from "@/lib/types";

export default function RenameTracelistDialog({
  traceList,
  compact = false,
}: {
  traceList: TracelistInfo;
  compact?: boolean;
}) {
  const [saving, setSaving] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>(traceList.name);
  const [renameDialogOpened, setRenameDialogOpened] = useState<boolean>(false);

  async function renameList() {
    setSaving(true);
    const error = await updateTracelist({
      traceListId: traceList.id,
      newName,
      axialCodeFeedback: traceList.axialCodeFeedback,
    });

    if (error) {
      setSaving(false);
      toast.error(error?.value?.message || "Failed to rename tracelist");
      return;
    }

    toast.success("Saved new tracelist name.");
    setRenameDialogOpened(false);
    setSaving(false);
  }

  function cancelRename() {
    setNewName(traceList.name);
  }

  return (
    <Dialog open={renameDialogOpened} onOpenChange={setRenameDialogOpened}>
      <DialogTrigger asChild>
        <Button
          variant={"ghost"}
          size={compact ? "icon-sm" : "default"}
          type={"button"}
          className={"justify-start"}
        >
          <LucideTextCursorInput size={compact ? 10 : 14} />
          Rename
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename tracelist</DialogTitle>
          <DialogDescription>Give a new name to a tracelist.</DialogDescription>
        </DialogHeader>
        <Input
          disabled={saving}
          value={newName}
          onChange={(v) => setNewName(v.target.value)}
          type={"text"}
          placeholder={"Enter a name..."}
        />
        <div className={"flex flex-row mt-2 gap-2 justify-end"}>
          <DialogClose asChild>
            <Button onClick={cancelRename} variant={"outline"}>
              <ArrowUpLeft />
              Cancel
            </Button>
          </DialogClose>
          <Button disabled={saving} onClick={renameList}>
            <LucideSave />
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
