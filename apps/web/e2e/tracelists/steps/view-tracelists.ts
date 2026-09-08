import { expect } from "@playwright/test";

import { Given, Then, When } from "@/e2e/fixtures";

Then(
  "display a list of trace lists showing the title, creation date, and completion status for each trace list",
  async ({ page }) => {
    const traceLists = await page.getByTestId("trace-list-card").all();
    expect(traceLists.length).toBeGreaterThan(0);

    for (const card of traceLists) {
      await expect(card.getByTestId("trace-list-title")).toBeVisible();
      await expect(card.getByTestId("trace-list-date")).toBeVisible();
      await expect(card.getByTestId("trace-list-status")).toBeVisible();
      await expect(card.getByTestId("trace-list-counts")).toBeVisible();
    }
  },
);

When("a trace list is selected", async ({ page }) => {
  const firstCard = page.getByTestId("trace-list-card").first();
  await firstCard.click();
});

Then("navigate to that trace list", async ({ page, project }) => {
  await page.waitForURL(`/${project.id}/${project.traceListId}/traces`);
  expect(page.url()).toMatch(`/${project.id}/${project.traceListId}/traces`);
});

When("the user filters on completed", async ({ page }) => {
  await page.getByTestId("filter-select").click();
  await page.getByRole("option", { name: "Only show completed" }).click();
});

Then("display only completed trace lists", async ({ page }) => {
  const cards = await page.getByTestId("trace-list-card").all();
  for (const card of cards) {
    const statusText = await card
      .getByTestId("trace-list-status")
      .textContent();
    expect(statusText?.trim()).toBe("(completed)");
  }
});

When("the user filters on not completed", async ({ page }) => {
  await page.getByTestId("filter-select").click();
  await page.getByRole("option", { name: "Only show to-do" }).click();
});

Then("display only trace lists that are not completed", async ({ page }) => {
  const cards = await page.getByTestId("trace-list-card").all();
  for (const card of cards) {
    const statusText = await card
      .getByTestId("trace-list-status")
      .textContent();
    expect(statusText?.trim()).toBe("(not completed)");
  }
});

When("the user enters a search term in the search bar", async ({ page }) => {
  const searchInput = page.getByTestId("search-input");
  await searchInput.fill("E2E");
});

Then(
  "display only trace lists where the title matches the search term",
  async ({ page }) => {
    const cards = await page.getByTestId("trace-list-card").all();
    for (const card of cards) {
      const title = await card.getByTestId("trace-list-title").textContent();
      expect(title?.toLowerCase()).toContain("e2e");
    }
  },
);

When("the project has no trace lists", async ({ page }) => {
  const emptyContainer = page.getByTestId("empty-tracelists-container");
  await expect(emptyContainer).toBeVisible();
});

Then(
  "display a text label indicating no trace lists are available",
  async ({ page }) => {
    const emptyLabel = page.getByTestId("empty-tracelists-label");
    await expect(emptyLabel).toBeVisible();
    await expect(emptyLabel).not.toBeEmpty();
  },
);

When("the trace lists could not be retrieved", async ({ page }) => {
  const errorContainer = page.getByTestId("tracelists-error-container");
  await expect(errorContainer).toBeVisible();
});

Then(
  "display an error indicating the trace lists could not be retrieved, including the reason why it failed",
  async ({ page }) => {
    const errorMessage = page.getByTestId("tracelists-error-message");
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).not.toBeEmpty();
  },
);
