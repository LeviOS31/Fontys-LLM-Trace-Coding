import { Elysia, InternalServerError, NotFoundError, t } from "elysia";
import { AxialCodesService } from "@repo/api/modules/axial/service";
import { AxialCodesModel } from "@repo/api/modules/axial/model";
import { JobService } from "@repo/api/modules/jobs/service";
import { JobModel } from "@repo/api/modules/jobs/model";

export default new Elysia({
  prefix: "/axial",
  detail: {
    tags: ["Axial Codes"],
    summary: "Axial Codes module",
    description: "Endpoints for managing axial codes.",
  },
})
  .post(
    "/:traceListId",
    async function ({ params, set }) {
      const job = await JobService.createJob({ name: "Generate axial code" });
      JobService.cleanupStalledJobs();

      if (!job) throw new NotFoundError();

      AxialCodesService.generateAxialCodes({
        ...params,
        expectedAmount: 5,
        jobId: job.id,
      }).catch((e) => {
        throw new InternalServerError(e.message);
      });

      set.status = 202;
      return job;
    },
    {
      response: {
        202: JobModel.JobModel,
      },
      detail: {
        summary: "Generate axial codes",
        description: "Generate axial codes for a given project and trace list.",
      },
    },
  )
  .get(
    "/:traceListId",
    //@ts-expect-error: The return type is the same as AxialCodesModel.AxialCodes but elysia is not able to infer it correctly
    async function ({ params }) {
      const { traceListId } = params;

      const result =
        await AxialCodesService.getValidatedAxialCodesByTraceListId(
          traceListId,
        );

      if (!result) throw new NotFoundError("Axial codes not found");

      return result;
    },
    {
      response: {
        200: AxialCodesModel.AxialCodes,
      },
      detail: {
        summary: "Get axial codes",
        description: "Retrieve axial codes for a given trace list.",
      },
    },
  )
  .get(
    "/:traceListId/statistics",
    async function ({ params }) {
      return AxialCodesService.getTraceListStatistics(params.traceListId);
    },
    {
      response: {
        200: AxialCodesModel.StatisticsResponse,
      },
      detail: {
        summary: "Get axial code statistics",
        description: "Retrieve axial code statistics for a given trace list.",
      },
    },
  )
  .patch(
    "/:traceListId/:axialCodeId",
    async ({ params, body }) => {
      return AxialCodesService.updateAxialCodeById({
        axialCodeId: params.axialCodeId,
        title: body.title,
        description: body.description,
        feedback: body.feedback,
      });
    },
    {
      params: t.Object({
        traceListId: t.String(),
        axialCodeId: t.String(),
      }),
      body: AxialCodesModel.UpdateAxialCodeBody,
      response: {
        200: t.Boolean(),
      },
      detail: {
        summary: "Update axial code",
        description: "Update title and description of an axial code by ID.",
      },
    },
  )
  .post(
    "/:traceListId/regenerate",
    async ({ params, set }) => {
      const traceListId = params.traceListId;

      const job = await JobService.createJob({
        name: "Regenerate axial Codes",
      });
      JobService.cleanupStalledJobs();

      if (!job) {
        throw new NotFoundError("Existing axial codes not found");
      }

      AxialCodesService.regenerateAxialCodes(traceListId, job.id).catch((e) =>
        console.error(e),
      );

      set.status = 202;
      return job;
    },
    {
      params: t.Object({
        traceListId: t.String(),
      }),
      response: {
        202: JobModel.JobModel,
      },
      detail: {
        summary: "Regenerate axial codes",
        description:
          "Regenerate axial codes for a given trace list removing the orignal ones.",
      },
    },
  )
  .post(
    "/:traceListId/accept/:jobId",
    async ({ params }) => {
      const { traceListId, jobId } = params;
      const job = await JobService.getJob(jobId);
      if (!job) throw new NotFoundError("Job not found");
      const metadata = job.metadata as Record<string, unknown>;
      if (!metadata?.pendingOutput) throw new Error("No pending output in prompt");
      await AxialCodesService.replaceAxialCodes(
        traceListId,
        metadata.pendingOutput as AxialCodesModel.llmAxialCode[],
      );
      await JobService.deleteJob(jobId);
      return { success: true };
    },
    {
      params: t.Object({ traceListId: t.String(), jobId: t.String() }),
      response: { 200: t.Object({ success: t.Boolean() }) },
      detail: { summary: "Accept regenerated axial codes" },
    },
  )
  .post(
    "/:traceListId/reject/:jobId",
    async ({ params }) => {
      const job = await JobService.getJob(params.jobId);
      if (!job) throw new NotFoundError("Job not found");
      await JobService.deleteJob(params.jobId);
      return { success: true };
    },
    {
      params: t.Object({ traceListId: t.String(), jobId: t.String() }),
      response: { 200: t.Object({ success: t.Boolean() }) },
      detail: { summary: "Reject regenerated axial codes" },
    },
  );
