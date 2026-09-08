import { NotFoundError } from "elysia";

import { prisma } from "@repo/db";

import { ai } from "@repo/api/lib/llm-client";
import { JudgeModel } from "@repo/api/modules/judge/model";

export abstract class JudgeService {
  static async getStaticAxialCodePrompts(
    axialCodeId: string,
  ): Promise<JudgeModel.PromptResponseBody> {
    const axialCodeData = await prisma.axialCode.findUnique({
      where: {
        id: axialCodeId,
      },
      select: {
        title: true,
        description: true,
      },
    });

    if (!axialCodeData) {
      throw new NotFoundError("The axial code does not exist");
    }

    return {
      system: await ai.renderPrompt("LLM_AS_A_JUDGE_STATIC_SYSTEM", {
        problem: {
          ...axialCodeData,
        },
      }),
      user: await ai.renderPrompt("LLM_AS_A_JUDGE_STATIC_USER", {}),
    };
  }

  static async generateAxialCodePrompt(
    axialCodeId: string,
    feedback: string,
    prompt?: string,
  ): Promise<JudgeModel.PromptGenerationResponseBody> {
    const axialCodeData = await prisma.axialCode.findUnique({
      where: {
        id: axialCodeId,
      },
      select: {
        title: true,
        description: true,
      },
    });

    if (!axialCodeData) {
      throw new NotFoundError("The axial code does not exist");
    }

    const systemMessage = await ai.renderPrompt(
      "LLM_AS_A_JUDGE_GENERATION_SYSTEM",
      {
        problem: {
          ...axialCodeData,
        },
        prompt: prompt,
      },
    );

    const userMessage = await ai.renderPrompt(
      "LLM_AS_A_JUDGE_GENERATION_USER",
      { feedback: feedback },
    );

    const response = await ai.model.invoke([
      {
        role: "system",
        content: systemMessage,
      },
      {
        role: "user",
        content: userMessage,
      },
    ]);
    return response.content.toString();
  }

  static async generateAxialCodePromptFromScratch(
    axialCodeId: string,
    feedback: string,
  ): Promise<JudgeModel.PromptGenerationResponseBody> {
    const axialCodeData = await prisma.axialCode.findUnique({
      where: {
        id: axialCodeId,
      },
      select: {
        title: true,
        description: true,
        connections: {
          select: {
            trace: {
              select: {
                input: true,
                output: true,
                feedback: true,
                openCode: true,
              },
            },
          },
        },
      },
    });

    if (!axialCodeData) {
      throw new NotFoundError("The axial code does not exist");
    }

    const systemMessage = await ai.renderPrompt(
      "LLM_AS_A_JUDGE_SCRATCH_SYSTEM",
      {
        problem: {
          title: axialCodeData.title,
          description: axialCodeData.description,
        },
        traces: JSON.stringify(axialCodeData.connections),
      },
    );

    const userMessage = await ai.renderPrompt("LLM_AS_A_JUDGE_SCRATCH_USER", {
      feedback: feedback,
    });

    const response = await ai.model.invoke([
      {
        role: "system",
        content: systemMessage,
      },
      {
        role: "user",
        content: userMessage,
      },
    ]);
    return response.content.toString();
  }

  static async evaluatePromptOnTraces(
    axialCodeId: string,
    prompt: string,
  ): Promise<JudgeModel.JudgeTemplateRunResponse> {
    const axialCodeTrace = (
      await prisma.traceConnection.findMany({
        where: {
          axialCodeId,
        },
        select: {
          trace: {
            select: {
              id: true,
              input: true,
              output: true,
            },
          },
        },
        take: 3,
      })
    )?.map((trace) => trace.trace);
    const nonAxialCodeTrace = await prisma.trace.findMany({
      where: {
        connections: {
          none: {
            axialCodeId,
          },
        },
      },
      select: {
        id: true,
        input: true,
        output: true,
      },
      take: 3,
    });

    if (!axialCodeTrace || !nonAxialCodeTrace) {
      throw new NotFoundError("The axial code does not exist");
    }

    const res = [];

    for (const trace of [...nonAxialCodeTrace, ...axialCodeTrace]) {
      const userMessage = await ai.renderPrompt("LLM_AS_A_JUDGE_STATIC_USER", {
        input: trace.input,
        output: trace.output,
      });
      const response = await ai.model.invoke([
        {
          role: "system",
          content: prompt,
        },
        {
          role: "user",
          content: userMessage,
        },
      ]);
      res.push({
        trace,
        response: JSON.parse(response.content.toString()),
      });
    }

    return res;
  }
}
