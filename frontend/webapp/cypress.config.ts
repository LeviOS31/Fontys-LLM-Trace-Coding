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
    baseUrl: 'http://localhost:5173',
    setupNodeEvents(on) {
      on('before:run', async () => {
        console.log('🔄 Resetting Docker (clean state)...');
        await runCommand('npm run docker:reset');

        // give services time to start
        await new Promise((r) => setTimeout(r, 5000));
      });
      on('task', {
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
