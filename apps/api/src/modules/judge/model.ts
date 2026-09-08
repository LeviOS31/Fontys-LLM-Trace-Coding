import { t } from "elysia";

export namespace JudgeModel {
  export const PromptGenerationBody = t.Object({
    feedback: t.String(),
    prompt: t.Optional(t.String()),
    scratch: t.Boolean({ default: false }),
  });

  export type PromptGenerationBody = typeof PromptGenerationBody.static;

  export const PromptTestRunBody = t.Object({
    prompt: t.String(),
  });

  export type PromptTestRunBody = typeof PromptTestRunBody.static;

  export const PromptResponseBody = t.Object({
    system: t.String(),
    user: t.String(),
  });

  export type PromptResponseBody = typeof PromptResponseBody.static;

  export const PromptGenerationResponseBody = t.String();

  export type PromptGenerationResponseBody =
    typeof PromptGenerationResponseBody.static;

  export const JudgeTemplateRunLLMResponse = t.Object({
    verdict: t.Boolean({ default: false }),
    justification: t.String(),
    severity: t.Numeric(),
  });

  export const JudgeTemplateRunTrace = t.Object({
    id: t.String(),
    input: t.String(),
    output: t.String(),
  });

  export const JudgeTemplateRunResponse = t.Array(
    t.Object({
      trace: JudgeTemplateRunTrace,
      response: JudgeTemplateRunLLMResponse,
    }),
  );

  export type JudgeTemplateRunResponse = typeof JudgeTemplateRunResponse.static;
}
