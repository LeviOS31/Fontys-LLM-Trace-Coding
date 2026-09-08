import { Elysia } from "elysia";
import { PromptService } from "@repo/api/modules/prompt/service";
import { PromptsModel } from "@repo/api/modules/prompt/model";

export default new Elysia({
  prefix: "/prompt",
  detail: {
    tags: ["Prompts"],
    summary: "Prompts module",
    description: "Endpoints for managing prompts.",
  },
})
  .patch(
    "/:promptId",
    async function ({ body, params }) {
      return await PromptService.updatePrompt(params.promptId, body.text);
    },
    {
      body: PromptsModel.updatePromptBodyModel,
      detail: {
        summary: "",
        description: "Update a prompt with new text.",
      },
      response: {
        200: PromptsModel.PromptModel,
      },
    },
  )
  .get(
    "/",
    async function () {
      return await PromptService.getPrompts();
    },
    {
      detail: {
        summary: "",
        description: "Get all prompts.",
      },
    },
  )
  .patch(
    "/:promptId/reset",
    async function ({ params }) {
      return await PromptService.setToDefault(params.promptId);
    },
    {
      response: {
        200: PromptsModel.PromptModel,
      },
      detail: {
        summary: "",
        description: "Reset prompt to default.",
      },
    },
  );
