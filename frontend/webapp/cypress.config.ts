import 'dotenv/config';
import { defineConfig } from 'cypress';
import { resetDb } from './cypress/db/resetDb';
import {
  seedDb,
  seedProjects,
  seedVersions,
  seedTraces,
  seedOpenCodes,
  seedAxialCodingResults,
  seedJudgeTemplates,
  SeedOpenCode,
  SeedAxialCodingResult,
  SeedJudgeTemplate,
} from './cypress/db/seedDb';
import { exec } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { Project } from './src/shared/types/project';
import { Version } from './src/shared/types/version';
import { TraceCollection } from './src/shared/types/trace';

function runCommand(command: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(stderr);
        return reject(error);
      }
      console.log(stdout);
      resolve();
    });
  });
}
export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL ?? 'http://localhost:5173',
    viewportWidth: 1280,
    viewportHeight: 720,
    setupNodeEvents(on, config) {
      const visualBaselineDir = path.resolve(__dirname, 'cypress', 'visual-baselines');
      const visualDiffDir = path.resolve(__dirname, 'cypress', 'visual-diffs');

      on('before:run', async () => {
        if (
          process.env.CYPRESS_SKIP_DOCKER_RESET === 'true' ||
          config.env.skipDockerReset === true
        ) {
          console.log('Skipping Docker reset; using the CI-provided test stack.');
          return;
        }

        console.log('🔄 Resetting Docker (clean state)...');
        await runCommand('npm run docker:reset');

        // give services time to start
        await new Promise((r) => setTimeout(r, 5000));
      });
      on('task', {
        compareVisualSnapshot({ name }: { name: string }) {
          if (!/^[a-z0-9-]+$/.test(name)) {
            throw new Error(`Invalid visual snapshot name: ${name}`);
          }
          if (typeof config.screenshotsFolder !== 'string') {
            throw new Error('Cypress screenshots must be enabled for visual regression tests.');
          }

          const actualPath = path.resolve(
            config.projectRoot,
            config.screenshotsFolder,
            'visual-regression.cy.ts',
            'visual-regression',
            `${name}.png`
          );
          const baselinePath = path.join(visualBaselineDir, `${name}.png`);
          if (!fs.existsSync(actualPath)) {
            throw new Error(`Screenshot not found: ${actualPath}`);
          }

          const actual = PNG.sync.read(fs.readFileSync(actualPath));
          if (config.env.updateVisualBaselines === true) {
            fs.mkdirSync(visualBaselineDir, { recursive: true });
            fs.writeFileSync(baselinePath, PNG.sync.write(actual));
            return { updated: true, mismatchedPixels: 0, mismatchRatio: 0 };
          }

          if (!fs.existsSync(baselinePath)) {
            throw new Error(
              `Missing visual baseline: ${baselinePath}. ` +
                'Run npm run visual:update to create or update baselines.'
            );
          }

          const baseline = PNG.sync.read(fs.readFileSync(baselinePath));
          if (baseline.width !== actual.width || baseline.height !== actual.height) {
            return {
              updated: false,
              mismatchedPixels: Number.POSITIVE_INFINITY,
              mismatchRatio: 1,
              dimensionMismatch: {
                expected: `${baseline.width}x${baseline.height}`,
                actual: `${actual.width}x${actual.height}`,
              },
            };
          }

          const diff = new PNG({ width: actual.width, height: actual.height });
          const mismatchedPixels = pixelmatch(
            baseline.data,
            actual.data,
            diff.data,
            actual.width,
            actual.height,
            { threshold: 0.1 }
          );
          const mismatchRatio = mismatchedPixels / (actual.width * actual.height);

          if (mismatchedPixels > 0) {
            fs.mkdirSync(visualDiffDir, { recursive: true });
            fs.writeFileSync(path.join(visualDiffDir, `${name}.png`), PNG.sync.write(diff));
          } else {
            const diffPath = path.join(visualDiffDir, `${name}.png`);
            if (fs.existsSync(diffPath)) fs.unlinkSync(diffPath);
          }

          return { updated: false, mismatchedPixels, mismatchRatio };
        },
        async resetDb() {
          await resetDb();
          return null;
        },
        async seedDb() {
          await seedDb();
          return null;
        },
        async seedProjects(projects: Project[]) {
          await seedProjects(projects);
          return null;
        },
        async seedVersions(versions: Version[]) {
          await seedVersions(versions);
          return null;
        },
        async seedTraces(collections: TraceCollection[]) {
          await seedTraces(collections);
          return null;
        },
        async seedOpenCodes(openCodes: SeedOpenCode[]) {
          await seedOpenCodes(openCodes);
          return null;
        },
        async seedAxialCodingResults(results: SeedAxialCodingResult[]) {
          await seedAxialCodingResults(results);
          return null;
        },
        async seedJudgeTemplates(templates: SeedJudgeTemplate[]) {
          await seedJudgeTemplates(templates);
          return null;
        },
      });
    },
  },
});
