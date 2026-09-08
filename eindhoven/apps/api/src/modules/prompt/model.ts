import { t } from "elysia";
import { PromptType } from "@repo/db/generated/prisma/enums";

export namespace PromptsModel {
  export const PromptModel = t.Object({
    id: t.String(),
    text: t.String(),
    promptType: t.Enum(PromptType),
  });

  export const updatePromptBodyModel = t.Object({
    text: t.String(),
  });

  export type Prompt = typeof PromptModel.static;
  export type updatePromptBody = typeof updatePromptBodyModel.static;
}
