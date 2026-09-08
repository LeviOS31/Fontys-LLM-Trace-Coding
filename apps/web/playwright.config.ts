import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";

const testDir = defineBddConfig({
  features: "e2e/**/features/**/*.feature",
  steps: ["e2e/**/steps/**/*.ts", "e2e/fixtures.ts"],
  outputDir: ".features-gen",
});

export default defineConfig({
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 4,

  testDir,
  outputDir: "test-results",
  reporter: [
    process.env.CI
      ? ["junit", { outputFile: "results.xml" }]
      : ["html", { open: "never" }],
  ],

  use: {
    baseURL: process.env.NEXT_PUBLIC_URL,
    video: "retain-on-failure",
  },

  webServer: process.env.CI
    ? undefined
    : {
        command: "cd ../../ && bun run dev",
        port: 3000,
        reuseExistingServer: !process.env.CI,
        timeout: 10000,
      },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
  ],
});
