import { expect } from "@playwright/test";

import { After, Before, Given, Then, When } from "@/e2e/fixtures";

let originalTitle = "";
let originalDescription = "";
let wasEdited = false;

Before(async () => {
  originalTitle = "";
  originalDescription = "";
  wasEdited = false;
});

After(async ({ page }) => {
  if (!wasEdited) return;

  const inputVisible = await page
    .getByTestId("axial-title-input")
    .isVisible()
    .catch(() => false);

  if (!inputVisible) {
    const editButton = page.getByTestId("edit-button");
    if (!(await editButton.isVisible().catch(() => false))) return;
    await editButton.click();
  }

  await page.getByTestId("axial-title-input").fill(originalTitle);
  await page.getByTestId("axial-description-input").fill(originalDescription);
  await page.getByTestId("save-button").click();
});

Given(
  "het systeem heeft axial codes en redenaties gegenereerd voor {string} in project {string}",
  async ({ page }, traceListId: string, projectId: string) => {
    await page.goto(`/${projectId}/${traceListId}/axial-codes`);
    await expect(page.getByTestId("axial-code-card").first()).toBeVisible({
      timeout: 15000,
    });
  },
);

Given("ik bekijk het resultatenoverzicht", async ({ page }) => {
  await page.getByTestId("axial-code-card").first().click();
  await expect(page.getByTestId("edit-button")).toBeVisible();
  originalTitle =
    (await page.getByTestId("axial-title-display").textContent()) ?? "";
  originalDescription =
    (await page.getByTestId("axial-description").textContent()) ?? "";
});

When(
  "ik een gegenereerde axial code of beschrijving wil wijzigen",
  async ({ page }) => {
    await page.getByTestId("edit-button").click();
  },
);

When(
  "ik een axial code een lege naam of beschrijving geef",
  async ({ page }) => {
    await page.getByTestId("edit-button").click();
    await page.getByTestId("axial-title-input").fill("");
    await page.getByTestId("save-button").click();
  },
);

Then("moet ik duidelijk zien dat dit aanpasbaar is", async ({ page }) => {
  await expect(page.getByTestId("axial-title-input")).toBeVisible();
  await expect(page.getByTestId("axial-description-input")).toBeVisible();
});

Then(
  "ik op de titel of beschrijving klik kan ik de tekst aanpassen",
  async ({ page }) => {
    await page.getByTestId("axial-title-input").fill("Aangepaste titel");
    await page
      .getByTestId("axial-description-input")
      .fill("Aangepaste beschrijving");

    await expect(page.getByTestId("axial-title-input")).toHaveValue(
      "Aangepaste titel",
    );
    await expect(page.getByTestId("axial-description-input")).toHaveValue(
      "Aangepaste beschrijving",
    );
  },
);

Then(
  "moeten de wijzigingen direct worden opgeslagen in de analyse",
  async ({ page }) => {
    await page.getByTestId("save-button").click();
    await expect(page.locator("text=Axial code saved.")).toBeVisible();
    await expect(page.getByTestId("axial-title-display")).toHaveText(
      "Aangepaste titel",
    );
    await expect(page.getByTestId("axial-description")).toHaveText(
      "Aangepaste beschrijving",
    );
    wasEdited = true;
  },
);

Then(
  "geeft het systeem een melding dat de gebruiker wat in moet vullen",
  async ({ page }) => {
    await expect(
      page.locator("text=Name and description are required"),
    ).toBeVisible();
  },
);
