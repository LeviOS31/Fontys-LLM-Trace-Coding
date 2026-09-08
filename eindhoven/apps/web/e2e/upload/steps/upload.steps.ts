import { expect } from "@playwright/test";

import { Given, Then, When } from "@/e2e/fixtures";
import path from "path";

Given(
  "I am on the upload page for a specific project and tracelist",
  async ({ project, page }) => {
    await page.goto(`/${project.id}/${project.traceListId}/upload`);
  },
);

When("I upload a correct file via the button", async ({ page }) => {
  await page
    .getByTestId("file-upload")
    .setInputFiles(path.join(__dirname, "data/correct.json"));

  const button = page.getByTestId("file-submit");
  await expect(button).toBeEnabled();
});

When("I manually select the correct file type", async ({ page }) => {
  await page.click('[data-testid="upload-file-type"]');
  await page.getByRole("option", { name: "JSON" }).click();

  const hiddenInput = page.locator('select[name="type"]');

  await expect(hiddenInput).toHaveValue("JSON");
});

When("I submit the file for processing", async ({ page }) => {
  const button = page.getByTestId("file-submit");
  await expect(button).toBeEnabled();

  await button.click();
});

When("I upload an incorrect file via the button", async ({ page }) => {
  await page
    .getByTestId("file-upload")
    .setInputFiles(path.join(__dirname, "data/incorrect.json"));

  const button = page.getByTestId("file-submit");
  await expect(button).toBeEnabled();
});

Then("I see the file in the file list", async ({ page }) => {
  await expect(page.getByTestId("file-list")).toHaveCount(1);
});

Then("I see the result of the processing", async ({ page }) => {
  await page.waitForURL("**\/traces");
  expect(page.url()).toContain("/traces");
});

Then("The file type is automatically selected", async ({ page }) => {
  await expect(page.locator('select[name="type"]')).toHaveValue("JSON");
});

Then(
  "I see a clear error message about what went wrong during processing",
  async ({ page }) => {
    const error = page.locator('[data-slot="field-error"]');
    await expect(error).toBeVisible();
    await expect(error).not.toBeEmpty();
  },
);

Then("I get the opportunity to refill the form", async ({ page }) => {
  const button = page.getByTestId("file-submit");
  await expect(button).toBeEnabled();
});

Then(
  "I must see visual feedback or an indicator that the system is busy",
  async ({ page }) => {
    const button = page.getByTestId("file-submit");
    await expect(button).toBeDisabled();
    const spinner = page.getByTestId("upload-pending-spinner");
    await expect(spinner).toBeVisible();
  },
);
