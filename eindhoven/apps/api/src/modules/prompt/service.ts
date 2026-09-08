import { prisma } from "@repo/db";
import { PromptsModel } from "@repo/api/modules/prompt/model";
import { promptTexts } from "@repo/api/lib/defaultPrompts";
import { NotFoundError } from "@repo/api/lib/errors";
import { PromptType } from "@repo/db/generated/prisma/enums";

export abstract class PromptService {
  static async updatePrompt(
    promptId: string,
    text: string,
  ): Promise<PromptsModel.Prompt> {
    return prisma.prompt.update({
      where: {
        id: promptId,
      },
      data: {
        text: text,
      },
    });
  }

  static async getPrompts(): Promise<PromptsModel.Prompt[]> {
    return prisma.prompt.findMany();
  }

  static async getPromptByType(type: PromptType): Promise<PromptsModel.Prompt> {
    const prompt = await prisma.prompt.findFirst({
      where: {
        promptType: type,
      },
    });

    if (!prompt)
      throw new NotFoundError("Prompt with type '" + type + "' not found");

    return prompt;
  }

  static async setToDefault(id: string): Promise<PromptsModel.Prompt> {
    const prompt = await prisma.prompt.findUnique({
      where: { id },
      select: { promptType: true },
    });

    if (!prompt) throw new NotFoundError("Prompt not found: " + id);

    return prisma.prompt.update({
      where: { id },
      data: {
        text: promptTexts[prompt.promptType],
      },
    });
  }
}
