import { expect } from "@playwright/test";

import { Given, Then, When } from "@/e2e/fixtures";

const ENTERED_CRITERIA =
  "## Richtlijnen\n- Controleer volledigheid\n- Controleer juistheid";
const PREVIOUSLY_SAVED_CRITERIA = "Eerste versie criteria";
const UPDATED_CRITERIA = "Bijgewerkte versie criteria";

When('the user selects the "assessment criteria" button', async ({ page }) => {
  await page.getByTestId("criteria-popover-trigger").click();
  await expect(page.getByTestId("criteria-popover-content")).toBeVisible();
});

Then(
  "display the current assessment criteria alongside an edit button.",
  async ({ page }) => {
    await expect(page.getByTestId("criteria-preview")).toBeVisible();
    await expect(page.getByTestId("criteria-edit")).toBeVisible();
  },
);

When("the edit button has been selected", async ({ page }) => {
  await page.getByTestId("criteria-popover-trigger").click();
  await expect(page.getByTestId("criteria-popover-content")).toBeVisible();

  await page.getByTestId("criteria-edit").click();
  await expect(page.getByTestId("criteria-textarea")).toBeVisible();
});

When("the user has entered assessment criteria", async ({ page }) => {
  await page.getByTestId("criteria-textarea").fill(ENTERED_CRITERIA);
});

When("the user saves the criteria", async ({ page }) => {
  const saveButton = page.getByTestId("criteria-save");
  await expect(saveButton).toBeEnabled();
  await saveButton.click();
});

Then(
  "the criteria are stored and linked to that project.",
  async ({ page }) => {
    const preview = page.getByTestId("criteria-preview");
    await expect(preview).toBeVisible();

    await page.getByTestId("criteria-popover-trigger").click();
    await expect(page.getByTestId("criteria-popover-content")).toBeHidden();

    await page.getByTestId("criteria-popover-trigger").click();
    await expect(page.getByTestId("criteria-popover-content")).toBeVisible();
  },
);

When("assessment criteria have previously been saved", async ({ page }) => {
  await page.getByTestId("criteria-popover-trigger").click();
  await expect(page.getByTestId("criteria-popover-content")).toBeVisible();

  await page.getByTestId("criteria-edit").click();
  await expect(page.getByTestId("criteria-textarea")).toBeVisible();

  await page.getByTestId("criteria-textarea").fill(PREVIOUSLY_SAVED_CRITERIA);

  const saveButton = page.getByTestId("criteria-save");
  await expect(saveButton).toBeEnabled();
  await saveButton.click();

  await expect(page.getByTestId("criteria-preview")).toContainText(
    PREVIOUSLY_SAVED_CRITERIA,
  );
});

When("the user edits and saves the criteria", async ({ page }) => {
  await page.getByTestId("criteria-popover-trigger").click();
  await expect(page.getByTestId("criteria-popover-content")).toBeVisible();

  await page.getByTestId("criteria-edit").click();
  await expect(page.getByTestId("criteria-textarea")).toBeVisible();

  await page.getByTestId("criteria-textarea").fill(UPDATED_CRITERIA);

  const saveButton = page.getByTestId("criteria-save");
  await expect(saveButton).toBeEnabled();
  await saveButton.click();
});

Then(
  "the updated criteria are stored and linked to that project.",
  async ({ page }) => {
    const preview = page.getByTestId("criteria-preview");
    await expect(preview).toBeVisible();
    await expect(preview).toContainText(UPDATED_CRITERIA);
  },
);

When("the save request fails", async ({ page }) => {
  await page.route("**/*", async (route) => {
    const request = route.request();
    const isServerActionPost = request.method().toUpperCase() === "POST";

    if (isServerActionPost) {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Forced save failure for e2e" }),
      });
      return;
    }

    await route.continue();
  });
});

When("the user saves assessment criteria", async ({ page }) => {
  await page.getByTestId("criteria-popover-trigger").click();
  await expect(page.getByTestId("criteria-popover-content")).toBeVisible();

  await page.getByTestId("criteria-edit").click();
  await expect(page.getByTestId("criteria-textarea")).toBeVisible();

  await page
    .getByTestId("criteria-textarea")
    .fill("Criteria die niet opgeslagen kunnen worden");

  const saveButton = page.getByTestId("criteria-save");
  await expect(saveButton).toBeEnabled();
  await saveButton.click();
});

Then(
  "display an error indicating the criteria could not be saved, including the reason why it failed.",
  async ({ page }) => {
    await expect(page.locator("text=Failed to update criteria.")).toBeVisible();
  },
);

Then("the criteria remain updated when the page reloads", async ({ page }) => {
  await page.reload();
  await page.getByTestId("criteria-popover-trigger").click();
  await expect(page.getByTestId("criteria-popover-content")).toBeVisible();
  const preview = page.getByTestId("criteria-preview");
  await expect(preview).toBeVisible();
  await expect(preview).toContainText(UPDATED_CRITERIA);
});
