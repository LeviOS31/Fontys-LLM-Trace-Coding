import { createBdd, test as base } from "playwright-bdd";

import { prisma } from "@repo/db";
import { client } from "@/lib/utils";

type Fixtures = {
  project: { id: string; traceListId: string };
  traces: {
    id: string;
    input: string;
    output: string;
  }[];
};

export const test = base.extend<Fixtures>({
  project: [
    async ({}, use) => {
      const result = await client.projects.post({
        name: `E2E testing - ${Date.now()}`,
        description: "E2E features tests",
      });

      if (!result.data || !("id" in result.data)) {
        throw new Error("Failed to fetch data");
      }

      const id = result.data.id;
      const list = await prisma.traceList.create({
        data: {
          projectId: id,
        },
        select: {
          id: true,
        },
      });

      await use({
        id,
        traceListId: list?.id.toString(),
      });

      await client.projects({ id }).delete();
    },
    { auto: true },
  ],
  traces: [
    async ({ project }, use) => {
      const file = await prisma.file.create({
        data: {
          name: "test.txt",
          size: 20,
          traceListId: project.traceListId,
        },
      });

      const traces = await prisma.trace.createManyAndReturn({
        data: [
          {
            input: "What is the capital of France?",
            output: "The capital of France is Paris.",
            fileId: file.id,
            traceListId: project.traceListId,
          },
          {
            input: "What is the largest mammal?",
            output: "The largest mammal is the blue whale.",
            fileId: file.id,
            traceListId: project.traceListId,
          },
        ],
        select: {
          id: true,
          input: true,
          output: true,
        },
      });

      await use(traces);
    },
    { auto: true },
  ],
});

export const { Given, When, Then, Before, After } = createBdd(test);
