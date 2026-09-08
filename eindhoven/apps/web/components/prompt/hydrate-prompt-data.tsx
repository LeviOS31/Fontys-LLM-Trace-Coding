"use client";

import { Prompt } from "@/lib/types";
import { useEffect } from "react";
import { usePromptState } from "@/state/prompt";

interface Props {
  prompts: Prompt[];
}

export default function HydratePromptData(props: Props) {
  const setPrompts = usePromptState((s) => s.setPrompts);

  useEffect(() => {
    setPrompts(props.prompts);
  }, [props.prompts, setPrompts]);

  return null;
}
