import {Elysia, NotFoundError, t} from "elysia";
import {JobService} from "@repo/api/modules/jobs/service";
import {JobModel} from "@repo/api/modules/jobs/model";

export default new Elysia({
  prefix: "/jobs",
  detail: {
    tags: ["Jobs"],
    summary: "Jobs module",
    description: "Endpoints for reading jobs.",
  },
})
  .get(
    "/:jobId",
    async ({ params }) => {
      const job = await JobService.getJob(params.jobId);

      if (!job) throw new NotFoundError("Job not found");

      return job;
    },
    {
      params: t.Object({
        jobId: t.String(),
      }),
      response: {
        200: JobModel.JobModel,
      },
      detail: {
        summary: "Upload file",
        description: "Upload a new file for parsing",
      },
    },
  )
  .patch(
    "/:jobId/cancel",
    async ({ params }) => {
      const job = await JobService.cancelJob(params.jobId);
      if (!job) throw new NotFoundError("Job could not be found");
      return job;
    },
    {
      params: t.Object({
        jobId: t.String()
      }),
      response: {
        200: JobModel.JobModel,
      },
      detail: {
        summary: "Cancel prompt",
        description: "Cancel a running prompt",
      }
    }
  )
  .get(
    "",
    async () => {
      const job = await JobService.getAll();

      if (!job || job.length === 0) throw new NotFoundError("No jobs found");

      return job;
    },
    {
      response: {
        200: JobModel.JobsModel,
      },
      detail: {
        summary: "Upload file",
        description: "Upload a new file for parsing",
      },
    },
  );
