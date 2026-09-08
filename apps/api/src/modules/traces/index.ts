import { Elysia, t } from "elysia";

import { GenericModel } from "@repo/api/lib/generic";
import { TracesModel } from "@repo/api/modules/traces/model";
import { TracesService } from "@repo/api/modules/traces/service";

export default new Elysia({
  prefix: "/traces",
  detail: {
    tags: ["Traces"],
    summary: "Traces module",
    description: "Endpoints for managing traces.",
  },
})
  .get(
    "/:traceId",
    async ({ params, set }) => {
      const { traceId } = params;
      const result = await TracesService.getTraceById(traceId);

      if ("status" in result) {
        set.status = result.status;
      }

      // Can't fix recursive types issue in Elysia, so we have to cast to any here
      // Total hours wasted: 2
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return result as any;
    },
    {
      params: t.Object({
        traceId: t.String(),
      }),
      response: {
        200: TracesModel.TraceResponse,
        404: GenericModel.ErrorResponse,
        500: GenericModel.ErrorResponse,
      },
      detail: {
        summary: "Trace details",
        description:
          "Fetches detailed information about a specific trace by its ID.",
      },
    },
  )
  .post(
    "/:traceId",
    async ({ params, body, set }) => {
      const { traceId } = params;

      const result = await TracesService.updateTrace({
        traceId,
        feedback: body.feedback,
        openCode: body.openCode,
        isFlagged: body.isFlagged,
      });

      if ("status" in result) {
        set.status = result.status;
        return result;
      }
    },
    {
      params: t.Object({
        traceId: t.String(),
      }),
      body: TracesModel.PostTraceBody,
      response: {
        200: t.Void(),
        500: GenericModel.ErrorResponse,
      },
      detail: {
        summary: "Review a trace",
        description: "Review a trace by its ID.",
      },
    },
  )
  .post(
    "/suggestion",
    async ({ body, set }) => {
      const res = await TracesService.getSuggestion(body);

      if ("status" in res) {
        set.status = res.status;
      }

      return res;
    },
    {
      body: TracesModel.PostSuggestionBody,
      response: {
        200: TracesModel.PostSuggestionResponse,
        500: GenericModel.ErrorResponse,
      },
      detail: {
        summary: "Trace AI suggestion",
        description: "Get an AI suggestion for a trace",
      },
    },
  );
