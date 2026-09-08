import { Elysia, NotFoundError, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";

import status from "./modules/status";
import files from "@repo/api/modules/files";
import traces from "@repo/api/modules/traces";
import lists from "@repo/api/modules/lists";
import axial from "@repo/api/modules/axial";
import projects from "@repo/api/modules/projects";
import jobs from "@repo/api/modules/jobs";
import judge from "@repo/api/modules/judge";
import settings from "@repo/api/modules/settings";
import prompts from "@repo/api/modules/prompt";
import { seedPrompts } from "@repo/api/lib/seed";
import { JobService } from "@repo/api/modules/jobs/service";

const isProduction = Bun.env.NODE_ENV === "production";

JobService.cleanupStalledJobs();
seedPrompts();

const app = new Elysia()
  .error({
    NotFoundError,
  })
  .onError(({ code, error }) => {
    switch (code) {
      case "NotFoundError":
        return error;
    }
  })
  .use(cors())
  .use(!isProduction && swagger())
  .use(status)
  .use(files)
  .use(traces)
  .use(lists)
  .use(jobs)
  .use(judge)
  .use(axial)
  .use(projects)
  .use(prompts)
  .use(settings)
  .get("/health", "ok", {
    response: {
      200: t.String(),
    },
    detail: {
      summary: "Status",
      description: "Endpoint to detect if the API is up.",
    },
  })
  .listen(3001);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);

export type App = typeof app;
