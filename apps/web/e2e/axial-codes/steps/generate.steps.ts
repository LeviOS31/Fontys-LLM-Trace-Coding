import { expect } from "@playwright/test";

import { Given, Then, When } from "@/e2e/fixtures";

Given(
  "ik ben op de tracelijst pagina van {string} in project {string}",
  async ({ page }, traceListId: string, projectId: string) => {
    await page.goto(`/${projectId}/${traceListId}/traces`);
  },
);

Given("ik zie een trace-lijst", async ({ page }) => {
  const traces = await page.getByTestId("trace-list-item");

  await expect(traces).toHaveCount(1);
});

Given("de lijst is volledig ingevuld", async ({ page }) => {
  const traces = await page.getByTestId("trace-list-item").all();

  for (const trace of traces) {
    const status = await trace.getAttribute("data-status");
    expect(status).toBe("true");
  }
});

Given("de lijst is niet volledig ingevuld", async ({ page }) => {
  const onvolledigItem = await page.locator(
    '[data-testid="trace-list-item"][data-status="false"]',
  );

  await expect(onvolledigItem.first()).toBeVisible();
});

When("ik op de genereer knop klik", async ({ page }) => {
  const button = page.getByTestId("generate-button");
  await button.click();
});

Then("is de genereer knop uitgeschakeld", async ({ page }) => {
  const button = page.getByTestId("generate-button");

  await expect(button).toBeDisabled();
});

Then("ik zie een laad-indicator", async ({ page }) => {
  const loadingToast = page.locator("text=Generating axial codes");
  await expect(loadingToast).toBeVisible();
});

When("geeft de laadindicator succes aan", async ({ page, $testInfo }) => {
  $testInfo.setTimeout(120000);
  const successToast = page.locator("text=Axial codes generated successfully");
  await expect(successToast).toBeVisible({ timeout: 100000 });
});

When(
  "ik naar de axial-codes pagina navigeer van {string} in project {string}",
  async ({ page }, traceListId: string, projectId: string) => {
    await page.goto(`/${projectId}/${traceListId}/axial-codes`);
  },
);

Then(
  "zie ik een lijst van codes en zie ik per axial code:",
  async ({ page }, dataTable) => {
    const requiredFields = dataTable.raw().flat();

    const axialCodeLocator = page.getByTestId("axial-code-card");

    await expect(axialCodeLocator.first()).toBeVisible();

    const axialCodes = await axialCodeLocator.all();

    for (const axialCode of axialCodes) {
      if (requiredFields.includes("title")) {
        await expect(axialCode.getByTestId("axial-title")).not.toBeEmpty();
      }

      if (requiredFields.includes("amount")) {
        await expect(axialCode.getByTestId("axial-amount")).not.toBeEmpty();
      }
    }
  },
);
When("de laad-indicator error aangeeft", async ({ page, $testInfo }) => {
  $testInfo.setTimeout(120000);
  const errorToast = page.locator("text=Error generating axial code");
  await expect(errorToast).toBeVisible({ timeout: 100000 });
});

Then("zie ik geen axial-codes", async ({ page }) => {
  const axialCodes = await page.getByTestId("axial-code-card").all();

  expect(axialCodes).toHaveLength(0);
});
