import { expect } from "@playwright/test";

import { prisma } from "@repo/db";
import { Given, Then, When } from "@/e2e/fixtures";

Given("The trace has context", async ({ page, project, traces }) => {
  await prisma.trace.update({
    where: { id: traces[0].id },
    data: {
      context: "Context for detailed reviewing",
      name: "Parent Trace",
    },
  });

  const { traceListId } = project;
  await page.goto(`/${project.id}/${traceListId}/traces/${traces[0].id}`);
});

When('I click on the "Detailed" button', async ({ page }) => {
  await page.getByTestId("view-toggle-detailed").click();
});

Then(
  "I see the detailed view of the trace including the context",
  async ({ page }) => {
    await expect(page.getByTestId("trace-section-context")).toBeVisible();
    await expect(
      page.getByText("Context for detailed reviewing"),
    ).toBeVisible();
  },
);

Given("The trace has children", async ({ page, project, traces }) => {
  await prisma.trace.update({
    where: { id: traces[0].id },
    data: {
      context: "Parent context",
      name: "Parent Trace",
    },
  });

  await prisma.trace.update({
    where: { id: traces[1].id },
    data: {
      parentId: traces[0].id,
      name: "Child Trace",
      context: "Child context",
    },
  });

  const { traceListId } = project;
  await page.goto(`/${project.id}/${traceListId}/traces/${traces[0].id}`);
});

Then("The tree view is opened", async ({ page }) => {
  await expect(page.getByTestId("trace-tree-panel")).toBeVisible();
  await expect(page.getByTestId("trace-tree-view")).toBeVisible();
});

Then(
  "I see the children of the trace in the tree view",
  async ({ page, traces }) => {
    await expect(
      page.getByTestId(`trace-tree-node-${traces[1].id}`),
    ).toBeVisible();
    await expect(page.getByText("Child Trace")).toBeVisible();
  },
);

Given(
  "There are other parents or children of the current trace in the tree view",
  async ({ page, project, traces }) => {
    await prisma.trace.update({
      where: { id: traces[0].id },
      data: {
        context: "Parent context",
        name: "Parent Trace",
      },
    });

    await prisma.trace.update({
      where: { id: traces[1].id },
      data: {
        parentId: traces[0].id,
        name: "Child Trace",
        context: "Child context",
      },
    });

    const { traceListId } = project;
    await page.goto(`/${project.id}/${traceListId}/traces/${traces[0].id}`);
    await page.getByTestId("view-toggle-detailed").click();
  },
);

When(
  "I click on a trace in the tree view that is not the current trace",
  async ({ page, traces }) => {
    await page.getByTestId(`trace-tree-node-${traces[1].id}`).click();
  },
);

Then("The information of the clicked trace is displayed", async ({ page }) => {
  await expect(page.getByTestId("trace-title")).toContainText("Child Trace");
  await expect(page.getByText("ID:")).toContainText("ID:");
});

Then("The reviewing interface is hidden", async ({ page }) => {
  await expect(page.getByTestId("reviewing-interface")).toBeHidden();
});

Given(
  "I am in the detailed view of a trace",
  async ({ page, project, traces }) => {
    await prisma.trace.update({
      where: { id: traces[0].id },
      data: {
        context: "Context for detailed reviewing",
        name: "Parent Trace",
      },
    });

    const { traceListId } = project;
    await page.goto(`/${project.id}/${traceListId}/traces/${traces[0].id}`);
    await page.getByTestId("view-toggle-detailed").click();
    await expect(page.getByTestId("trace-section-context")).toBeVisible();
  },
);

When('I click on the "Simple" button', async ({ page }) => {
  await page.getByTestId("view-toggle-simple").click();
});

Then("I am directed back to the simple view of the trace", async ({ page }) => {
  await expect(page.getByTestId("view-toggle-simple")).toHaveAttribute(
    "data-state",
    "on",
  );
  await expect(page.getByTestId("trace-section-context")).toHaveCount(0);
});
