"use client";

import { startTransition, useState } from "react";
import { Check, Pencil, Table } from "lucide-react";
import { toast } from "sonner";

import { AxialCode } from "@/lib/types";
import { updateAxialCode } from "@/app/[projectId]/[traceListId]/axial-codes/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface Props {
  axialCode: AxialCode;
}

export default function AxialCodeDetails({ axialCode }: Props) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(axialCode.title);

  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState(axialCode.description);

  const handleStartTitleEdit = () => {
    setTitleDraft(axialCode.title);
    setIsEditingTitle(true);
  };

  const handleSaveTitle = () => {
    if (!isEditingTitle) return;
    setIsEditingTitle(false);
    const trimmed = titleDraft.trim();
    if (trimmed !== "" && trimmed !== axialCode.title) {
      onSave?.({ ...axialCode, title: trimmed });
    }
  };

  const handleStartDescEdit = () => {
    setDescDraft(axialCode.description);
    setIsEditingDesc(true);
  };

  const handleSaveDesc = () => {
    if (!isEditingDesc) return;
    setIsEditingDesc(false);
    const trimmed = descDraft.trim();
    if (trimmed !== "" && trimmed !== axialCode.description) {
      onSave?.({ ...axialCode, description: trimmed });
    }
  };

  function onSave(updatedCode: AxialCode) {
    const toastId = toast.loading("Saving axial code...");
    startTransition(async () => {
      try {
        await updateAxialCode({
          traceListId: axialCode.traceListId as string,
          axialCodeId: axialCode.id as string,
          title: updatedCode.title,
          description: updatedCode.title,
          feedback: axialCode?.feedback ?? "",
        });

        toast.success("Axial code saved", { id: toastId });
      } catch (error) {
        let description =
          "Something went wrong while saving the axial code. Try again later.";
        if (error instanceof Error) {
          description = error.message;
        }

        toast.error("Something went wrong", { id: toastId, description });
      }
    });
  }

  if (!axialCode) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {isEditingTitle ? (
          <>
            <Input
              type="text"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => e.key === "Enter" && handleSaveTitle()}
              className="Text-2xl font-bold w-fit"
              autoFocus
            />
            <Check
              className="w-5 h-5 text-green-600 cursor-pointer hover:text-green-700 shrink-0"
              onClick={handleSaveTitle}
              aria-label="Save title"
            />
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold">{axialCode.title}</h1>
            <Pencil
              className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600 shrink-0"
              onClick={handleStartTitleEdit}
              aria-label="Edit title"
            />
          </>
        )}
      </div>

      <div className="flex gap-2">
        <Badge>{axialCode.id}</Badge>
        <Badge>
          <Table className="mr-1" /> {axialCode.connections.length}
        </Badge>
      </div>

      <div className="flex items-start gap-2">
        {isEditingDesc ? (
          <>
            <Textarea
              value={descDraft}
              onChange={(e) => setDescDraft(e.target.value)}
              onBlur={handleSaveDesc}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSaveDesc();
                }
              }}
              autoFocus
            />
            <Check
              className="w-5 h-5 text-green-600 cursor-pointer hover:text-green-700 shrink-0 mt-1"
              onClick={handleSaveDesc}
              aria-label="Save description"
            />
          </>
        ) : (
          <>
            <p className=" text-neutral-600 text-sm whitespace-pre-wrap w-fit">
              {axialCode.description}
            </p>
            <Pencil
              className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600 shrink-0 mt-0.5"
              onClick={handleStartDescEdit}
              aria-label="Edit description"
            />
          </>
        )}
      </div>
    </div>
  );
}
