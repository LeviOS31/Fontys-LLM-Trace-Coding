import { Prompt } from "@/lib/types";
import { create } from "zustand";

interface PromptState {
  prompts: Prompt[];
  setPrompts: (prompts: Prompt[]) => void;
  updatePrompt: (prompt: Prompt) => void;
}

export const usePromptState = create<PromptState>()((set) => ({
  prompts: [],
  setPrompts: (prompts: Prompt[]) => {
    set(() => ({ prompts }));
  },
  updatePrompt: (prompt: Prompt) =>
    set((state) => ({
      prompts: state.prompts.map((p) =>
        p.promptType === prompt.promptType ? prompt : p,
      ),
    })),
}));
