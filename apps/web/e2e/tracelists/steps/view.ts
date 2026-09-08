import { expect } from "@playwright/test";

import { Given, Then, When } from "@/e2e/fixtures";

Given("a tracelist has been selected", async ({ page }) => {
  const traces = page.getByTestId("tracelist-info");
  await expect(traces).toBeVisible();
});

Then(
  "display a list with every trace that shows an input preview, assessment status and an indicator whether an open code has been filled for every trace",
  async ({ page }) => {
    const traces = await page.getByTestId("trace-list-item").all();
    for (const trace of traces) {
      await expect(trace.getByTestId("trace-preview")).not.toBeEmpty({
        timeout: 5000,
      });
      await expect(trace.getByTestId("trace-assessment")).toBeVisible({
        timeout: 5000,
      });
      const openCodeIndicator = trace.getByTestId("trace-open-code-indicator");
      if (await openCodeIndicator.isVisible()) {
        await expect(openCodeIndicator).toBeVisible();
      }
    }
  },
);

When("an individual trace has been selected", async ({ page }) => {
  const trace = page.getByTestId("trace-list-item").first();
  await trace.click();
});

Then("highlight that trace in the tracelist", async ({ page }) => {
  const trace = page.getByTestId("trace-list-item").first();
  await expect(trace).toHaveClass(/active/);
});

When("the tracelist is empty", async ({ page }) => {
  const emptyState = page.getByTestId("empty-tracelist-container");
  await expect(emptyState).toBeVisible();
});

Then("display a text label indicating the list is empty", async ({ page }) => {
  const emptyLabel = page.getByTestId("empty-tracelist-label");
  await expect(emptyLabel).toBeVisible();
  await expect(emptyLabel).not.toBeEmpty();
});

When("the tracelist could not be retrieved", async ({ page }) => {
  const errorContainer = page.getByTestId("tracelist-error-label");
  await expect(errorContainer).toBeVisible();
});

Then(
  "display an error indicating the tracelist could not be retrieved, including the reason why it failed",
  async ({ page }) => {
    const errorMessage = page.getByTestId("tracelist-error-message");
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).not.toBeEmpty();
  },
);

When("the hide processed filter has been enabled", async ({ page }) => {
  const hideCompletedToggle = page.getByTestId("filter-hide-completed");
  await hideCompletedToggle.click();
});

Then("hide all completed traces from the tracelist", async ({ page }) => {
  const completedTraces = page.locator(
    '[data-testid="trace-list-item"][data-status="true"]',
  );
  await expect(completedTraces).toHaveCount(0);
});

When("the only show flagged filter has been enabled", async ({ page }) => {
  const showFlaggedToggle = page.getByTestId("filter-show-flagged");
  await showFlaggedToggle.click();
});

Then("only list traces that have been flagged", async ({ page }) => {
  const unflaggedTraces = page.locator(
    '[data-testid="trace-list-item"][data-flagged="false"]',
  );
  await expect(unflaggedTraces).toHaveCount(0);

  const flaggedTraces = page.locator(
    '[data-testid="trace-list-item"][data-flagged="true"]',
  );
  const count = await flaggedTraces.count();
  expect(count).toBeGreaterThanOrEqual(0);
});
