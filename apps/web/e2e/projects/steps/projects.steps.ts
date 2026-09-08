import { expect, type Locator, type Page } from "@playwright/test";

import { After, Before, Given, Then, When } from "@/e2e/fixtures";

let projectsToCleanup: string[] = [];

async function getProjectCardByName(
  page: Page,
  name: string,
): Promise<Locator> {
  return page.getByTestId("project-card").filter({
    has: page.getByTestId("project-name").getByText(name, { exact: true }),
  });
}

async function deleteProjectByName(page: Page, name: string) {
  const card = (await getProjectCardByName(page, name)).first();
  if ((await card.count()) === 0) return;
  await card.getByTestId("project-ellipsis").click({ force: true });
  await page.getByTestId("project-delete").click({ force: true });
  await page
    .getByTestId("confirm-delete-project-button")
    .click({ force: true });
  await expect(card).toBeHidden();
}

Before(async () => {
  projectsToCleanup = [];
});

After(async ({ page }) => {
  if (projectsToCleanup.length === 0) return;
  await page.goto("/");
  for (const name of projectsToCleanup) {
    await deleteProjectByName(page, name);
  }
  projectsToCleanup = [];
});

Given("ik ben op de projectenpagina", async ({ page }) => {
  await page.goto("/");
});

Given(
  "er bestaat al een project met naam {string}",
  async ({ page }, name: string) => {
    await page.getByTestId("new-project-button").click();
    await page.getByTestId("project-name-input").fill(name);
    await page.getByTestId("create-project-button").click();
    await expect(page.getByTestId("create-project-dialog")).toBeHidden();
    projectsToCleanup.push(name);
  },
);

When("ik klik op {string}", async ({ page }, label: string) => {
  const actions: Record<string, () => Promise<void>> = {
    "Nieuw project": () => page.getByTestId("new-project-button").click(),
    "Project aanmaken": () => page.getByTestId("create-project-button").click(),
    Bewerken: () => page.getByTestId("project-edit").click({ force: true }),
    Opslaan: () => page.getByTestId("save-project-button").click(),
  };
  await actions[label]?.();
});

When(
  "ik vul {string} in met {string}",
  async ({ page }, field: string, value: string) => {
    const fields: Record<string, () => Promise<void>> = {
      Naam: () => page.getByTestId("project-name-input").fill(value),
      Beschrijving: () => page.getByTestId("project-desc-input").fill(value),
    };
    await fields[field]?.();
  },
);

When(
  "ik open het menu van project {string}",
  async ({ page }, name: string) => {
    const card = await getProjectCardByName(page, name);
    await card.first().getByTestId("project-ellipsis").click({ force: true });
  },
);

Then("zie ik een succesmelding {string}", async ({ page }) => {
  await expect(page.locator("text=Created the project")).toBeVisible();
});

Then("zie ik een foutmelding {string}", async ({ page }) => {
  await expect(page.getByTestId("project-form-error")).toBeVisible();
});

Then(
  "zie ik het project {string} in de projectenlijst",
  async ({ page }, name: string) => {
    const card = await getProjectCardByName(page, name);
    await expect(card.first()).toBeVisible();
    projectsToCleanup.push(name);
  },
);

Then(
  "zie ik het project {string} niet meer in de projectenlijst",
  async ({ page }, name: string) => {
    const card = await getProjectCardByName(page, name);
    await expect(card).toHaveCount(0);
  },
);

Then("is het project niet dubbel aangemaakt", async ({ page }) => {
  const cards = page.getByTestId("project-card").filter({
    has: page
      .getByTestId("project-name")
      .getByText("Project 1", { exact: true }),
  });
  await expect(cards).toHaveCount(1);
});
