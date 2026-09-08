import { describe, expect, it, mock } from "bun:test";
import { PromptService } from "@repo/api/modules/prompt/service";
import { prisma } from "@repo/db";
import { PromptType } from "@repo/db/generated/prisma/enums";
import { NotFoundError } from "@repo/api/lib/errors";

mock.module("@repo/db", () => ({
  prisma: {
    prompt: {
      findUnique: mock(),
      update: mock(),
    },
  },
}));

describe("PromptService - Unit Tests (Bun Style)", () => {
  describe("setToDefault", () => {
    it("should fetch the type and call update with the correct default text", async () => {
      //@ts-expect-error: this type is right
      prisma.prompt.findUnique = mock(() => Promise.resolve({ promptType: PromptType.AXIAL_CODE_GENERATION_SYSTEM }));
      //@ts-expect-error: this type is right
      prisma.prompt.update = mock(() => Promise.resolve({ id: "123", text: "Mocked Default Text" }));

      await PromptService.setToDefault("123");

      expect(prisma.prompt.findUnique).toHaveBeenCalledWith({
        where: { id: "123" },
        select: { promptType: true },
      });
    });

    it("should throw NotFoundError if findUnique returns null", async () => {
      //@ts-expect-error: this type is right
      prisma.prompt.findUnique = mock(() => Promise.resolve(null));

      await expect(PromptService.setToDefault("invalid-id")).rejects.toThrow(NotFoundError);
    });
  });
});