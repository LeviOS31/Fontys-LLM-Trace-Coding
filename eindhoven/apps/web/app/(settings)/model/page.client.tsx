"use client";

import { toast } from "sonner";

import { changeModel } from "./actions";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { FileWarningIcon } from "lucide-react";

export default function ClientPage({
  data,
}: {
  data: {
    selected: string;
    available: { id: string; owned_by: string }[];
  } | null;
}) {
  async function tryChange(e: string) {
    const toastId = toast.loading("Changing model...");
    const result = await changeModel(e);

    if (result) {
      toast.success("Model changed", {
        id: toastId,
        description: `Model is now set to "${e}"`,
      });
    } else {
      toast.error("Model not changed", {
        id: toastId,
        description: "Something went wrong, try again later.",
      });
    }
  }

  if (!data) {
    return (
      <Empty data-testid="empty-tracelists-container" className={"h-full"}>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileWarningIcon />
          </EmptyMedia>
          <EmptyTitle data-testid="empty-tracelists-label">
            No models loaded or cannot connect to LLM client.
          </EmptyTitle>
          <EmptyDescription>
            Check your connection to the llm client, or install models.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <RadioGroup
      defaultValue={data.selected}
      className="grid grid-cols-1 md:grid-cols-4"
      onValueChange={tryChange}
    >
      {data.available.map((model: { id: string; owned_by: string }) => (
        <FieldLabel
          htmlFor={model.id}
          key={`${model.id}-${model.owned_by}`}
          className="cursor-pointer"
        >
          <Field orientation="horizontal">
            <FieldContent>
              <FieldTitle>{model.id}</FieldTitle>
              <FieldDescription>
                <Badge>{model.owned_by}</Badge>
              </FieldDescription>
            </FieldContent>
            <RadioGroupItem value={model.id} id={model.id} />
          </Field>
        </FieldLabel>
      ))}
    </RadioGroup>
  );
}
