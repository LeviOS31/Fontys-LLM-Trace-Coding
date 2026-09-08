"use client";

import { Button } from "@/components/ui/button";
import { ListCheckIcon, PencilIcon, SaveIcon, XCircleIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useContext, useState } from "react";
import Markdown from "react-markdown";
import { updateCriteria } from "@/app/[projectId]/actions";
import { toast } from "sonner";
import { useProjectStore } from "@/state/project";

export default function CriteriaPopover() {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatedCriteria, setUpdatedCriteria] = useState("");

  const project = useProjectStore((s) => s.project);

  async function save() {
    const projectId = project?.id;
    if (!projectId) {
      toast.error("Project not available.");
      return;
    }
    setSaving(true);
    const saveResult = await updateCriteria({
      id: projectId,
      assessmentCriteria: updatedCriteria,
    });
    if (saveResult && "message" in saveResult) {
      toast.error("Failed to update criteria.");
      return;
    }
    setSaving(false);
    setEditing(false);
    toast.success("Project criteria updated.");
  }

  function cancel() {
    setEditing(false);
    setUpdatedCriteria(project?.assessmentCriteria ?? "");
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          data-testid="criteria-popover-trigger"
          className={"justify-center items-center"}
          type={"button"}
          variant={"outline"}
        >
          <ListCheckIcon />
          Assessment criteria
        </Button>
      </PopoverTrigger>
      <PopoverContent data-testid="criteria-popover-content">
        <PopoverHeader className={"mb-3"}>
          <PopoverTitle>Criteria</PopoverTitle>
          <PopoverDescription>
            Project-wide criteria, visible during trace assessment. Supports
            markdown.
          </PopoverDescription>
        </PopoverHeader>

        {editing ? (
          <>
            <Textarea
              data-testid="criteria-textarea"
              onChange={(v) => setUpdatedCriteria(v.target.value)}
              value={updatedCriteria}
              disabled={saving}
              className={`mb-3 h-60 resize-none ${saving && "animate-pulse"}`}
            ></Textarea>
            <div className={"flex gap-2 justify-end"}>
              <Button variant={"outline"} onClick={cancel}>
                <XCircleIcon />
                Cancel
              </Button>
              <Button data-testid="criteria-save" onClick={save}>
                <SaveIcon />
                Save
              </Button>
            </div>
          </>
        ) : (
          <>
            <div
              data-testid="criteria-preview"
              className={
                "h-60 bg-neutral-50 markdown p-3 rounded-xl mb-3 text-sm overflow-auto"
              }
            >
              <Markdown>{project?.assessmentCriteria}</Markdown>
            </div>
            <div className={"flex gap-2 justify-end"}>
              <Button
                data-testid="criteria-edit"
                className={"ml-auto"}
                variant={"outline"}
                onClick={() => {
                  setUpdatedCriteria(project?.assessmentCriteria ?? "");
                  setEditing(true);
                }}
              >
                <PencilIcon />
                Edit
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
