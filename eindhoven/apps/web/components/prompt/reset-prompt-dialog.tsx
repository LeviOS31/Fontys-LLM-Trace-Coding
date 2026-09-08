"use client";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Prompt } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import { usePromptState } from "@/state/prompt";
import { useState } from "react";
import { toast } from "sonner";
import { resetPromptAction } from "@/app/(settings)/prompts/actions";

interface Props {
  prompt: Prompt;
}

export default function ResetPromptDialog({ prompt }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const updatePrompt = usePromptState((state) => state.updatePrompt);

  async function handleReset() {
    resetPromptAction({ promptId: prompt.id })
      .then((updatedPrompt) => {
        if (updatedPrompt instanceof Error || !updatedPrompt) {
          throw updatedPrompt ?? new Error("Failed to reset prompt");
        }

        updatePrompt(updatedPrompt);
        setIsOpen(false);
      })
      .catch((error) => {
        console.error(error);
        toast.error("Something went wrong resetting the prompt");
      });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={"destructive"}>
          <RefreshCcw />
          Reset Prompt
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset Prompt</DialogTitle>
        </DialogHeader>
        <p>
          Are you sure you want to reset the prompt for {prompt.promptType}. The
          current prompt will be lost and cannot be reset.
        </p>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant={"outline"}>Cancel</Button>
          </DialogClose>
          <Button variant={"destructive"} onClick={() => handleReset()}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
