import { expect } from "@playwright/test";

import { prisma } from "@repo/db";
import { Given, Then, When } from "@/e2e/fixtures";

Given("I have read the trace", async ({ page, project, traces }) => {
  const { traceListId } = project;
  await page.goto(`/${project.id}/${traceListId}/traces/${traces[0].id}`);
});

When(
  "I give a positive review by clicking the thumbs up button",
  async ({ page }) => {
    await page.getByTestId("feedback-button-positive").click();
  },
);

Then("My review is saved", async ({ traces }) => {
  await expect
    .poll(async () => {
      const trace = await prisma.trace.findUnique({
        where: { id: traces[0].id },
        select: { feedback: true },
      });
      return trace?.feedback;
    })
    .toBe("positive");
});

Then("I see a message {string}", async ({ page }, message: string) => {
  await expect(page.getByText(message)).toBeVisible();
});

Then(
  "I am directed to the next trace in the list",
  async ({ page, traces }) => {
    await page.waitForURL(`/**/traces/${traces[1].id}`);
    expect(page.url()).toContain(traces[1].id);
    expect(page.pageErrors()).toEqual([]);
  },
);

When(
  "I give a negative review by clicking the thumbs down button",
  async ({ page }) => {
    await page.getByTestId("feedback-button-negative").click();
  },
);

Then("Will the open code input field be displayed", async ({ page }) => {
  const openCodeInput = page.getByTestId("open-code-input");
  await expect(openCodeInput).toBeEnabled();
});

Given("I have given a negative review", async ({ page, project, traces }) => {
  const { traceListId } = project;
  await page.goto(`/${project.id}/${traceListId}/traces/${traces[0].id}`);
  await page.getByTestId("feedback-button-negative").click();
});

When("I have filled in the open code field", async ({ page }) => {
  await page
    .getByTestId("open-code-input")
    .fill("The model's response was incorrect because...");
});

When("I click the submit button", async ({ page }) => {
  await page.getByTestId("next-button").click();
});

Then("The review is saved", async ({ traces }) => {
  await expect
    .poll(async () => {
      const trace = await prisma.trace.findUnique({
        where: { id: traces[0].id },
        select: { feedback: true, openCode: true },
      });
      return {
        feedback: trace?.feedback,
        openCode: trace?.openCode,
      };
    })
    .toEqual({
      feedback: "negative",
      openCode: "The model's response was incorrect because...",
    });
});
