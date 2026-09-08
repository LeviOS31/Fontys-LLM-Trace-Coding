"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { usePromptState } from "@/state/prompt";
import { useEffect, useMemo, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import ResetPromptDialog from "@/components/prompt/reset-prompt-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, LoaderCircle, X } from "lucide-react";
import { updatePromptAction } from "./actions";

export default function PromptSettingsPage() {
  const [saveState, setSaveState] = useState<"loading" | "ok" | "error">("ok");
  const [promptText, setPromptText] = useState<string>("");
  const prompts = usePromptState((state) => state.prompts);
  const updatePrompt = usePromptState((state) => state.updatePrompt);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const typeParam = searchParams.get("type") || "";
  const lastUnderscore = typeParam.lastIndexOf("_");
  const groupName = typeParam.substring(0, lastUnderscore);
  const suffix = typeParam.substring(lastUnderscore + 1);

  const handleTabChange = (newSuffix: string) => {
    router.push(`${pathname}?type=${groupName}_${newSuffix}`);
  };

  const selectedPrompt = useMemo(() => {
    return prompts.find((p) => p.promptType === searchParams.get("type"));
  }, [searchParams, prompts]);

  useEffect(() => {
    if (selectedPrompt) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPromptText(selectedPrompt.text);
    }
  }, [selectedPrompt]);

  if (!selectedPrompt) {
    return <div>Select a prompt to edit</div>;
  }

  async function updatePromptText() {
    if (!selectedPrompt) return;
    setSaveState("loading");
    updatePromptAction({ promptId: selectedPrompt.id, text: promptText })
      .then((updatedPrompt) => {
        if (updatedPrompt instanceof Error || !updatedPrompt) {
          throw updatedPrompt ?? new Error("Failed to update prompt");
        }

        updatePrompt(updatedPrompt);
        setSaveState("ok");
      })
      .catch((error) => {
        console.error(error);
        setSaveState("error");
      });
  }

  const statusMessages = {
    loading: <LoaderCircle className={"animate-spin"} />,
    ok: <Check color={"green"} />,
    error: <X color={"red"} />,
  };

  return (
    <div className="p-4 w-full h-full mb-4">
      <div className={`flex flex-row justify-between items-center gap-2 mb-4`}>
        <h1 className="text-2xl font-bold">
          {selectedPrompt.promptType
            .replace(/_(USER|SYSTEM)$/, "")
            .toLowerCase()
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")}
        </h1>
        <div className={`ml-auto`}>{statusMessages[saveState]}</div>
        <Tabs value={suffix} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="SYSTEM">System Prompt</TabsTrigger>
            <TabsTrigger value="USER">User Prompt</TabsTrigger>
          </TabsList>
        </Tabs>
        <ResetPromptDialog prompt={selectedPrompt} />
      </div>
      <Textarea
        onBlur={() => updatePromptText()}
        value={promptText}
        onChange={(e) => setPromptText(e.target.value)}
        className={`w-full flex-1 resize-none h-[600px]`}
      />
    </div>
  );
}
