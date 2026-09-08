"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Suggestion = {
  feedback: "positive" | "negative";
  openCode: string;
};

interface UseAiSuggestionProps {
  currentTrace: string;
  nextTrace?: string | null;
  load: boolean;
}

export function useAiSuggestion({
  currentTrace,
  nextTrace,
  load,
}: UseAiSuggestionProps) {
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const getSuggestion = async () => {
      setSuggestion(null);

      if (!load) {
        return;
      }

      try {
        const res = await fetch(`/api/traces/suggestion`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currentTrace,
            nextTrace: nextTrace ?? undefined,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          toast.error("Failed to get suggestion");
          return;
        }

        const data = await res.json();

        setSuggestion(data);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        throw error;
      }
    };

    getSuggestion();

    return () => {
      controller.abort();
    };
  }, [currentTrace, nextTrace, load]);

  return suggestion;
}
