import { Elysia, t } from "elysia";

import { JudgeService } from "@repo/api/modules/judge/service";
import { JudgeModel } from "@repo/api/modules/judge/model";

export default new Elysia({
  prefix: "/judge",
  detail: {
    tags: ["LLM as a judge"],
    summary: "LLM as a judge module",
    description: "Endpoints for LLM as a judge operations.",
  },
})
  .get(
    "/:axialCodeId",
    async function ({ params }) {
      return JudgeService.getStaticAxialCodePrompts(params.axialCodeId);
    },
    {
      response: {
        200: JudgeModel.PromptResponseBody,
      },
      detail: {
        summary: "Get static prompts",
        description: "Get static LLM-as-a-judge prompts for given axial-code.",
      },
    },
  )
  .post(
    "/:axialCodeId/generate",
    async function ({ body, params }) {
      return await (body.scratch
        ? JudgeService.generateAxialCodePromptFromScratch(
            params.axialCodeId,
            body.feedback,
          )
        : JudgeService.generateAxialCodePrompt(
            params.axialCodeId,
            body.feedback,
            body.prompt,
          ));
    },
    {
      body: JudgeModel.PromptGenerationBody,
      response: {
        200: JudgeModel.PromptGenerationResponseBody,
      },
      detail: {
        summary: "Generate LLM prompt",
        description:
          "Generate an LLM-as-a-judge prompt from scratch or based on feedback.",
      },
    },
  )
  .post(
    "/:axialCodeId/test",
    function ({ body, params }) {
      return JudgeService.evaluatePromptOnTraces(
        params.axialCodeId,
        body.prompt,
      );
    },
    {
      body: JudgeModel.PromptTestRunBody,
      response: {
        200: JudgeModel.JudgeTemplateRunResponse,
      },
      detail: {
        summary: "Sample prompt run",
        description: "Run the LLM-as-a-judge prompt through a sample run.",
      },
    },
  );
