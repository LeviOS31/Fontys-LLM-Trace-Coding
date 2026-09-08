import { prisma } from "@repo/db";
import { PromptType } from "@repo/db/generated/prisma/enums";
import { promptTexts } from "@repo/api/lib/defaultPrompts";

export async function seedPrompts() {
  for (const promptType of Object.values(PromptType)) {
    const textToInsert = promptTexts[promptType] || "";

    await prisma.prompt.upsert({
      where: {
        promptType: promptType,
      },
      update: {},
      create: {
        promptType: promptType,
        text: textToInsert,
      },
    });
  }
}
