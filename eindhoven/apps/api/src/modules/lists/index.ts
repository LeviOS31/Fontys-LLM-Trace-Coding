import { Elysia } from "elysia";

import { GenericModel } from "@repo/api/lib/generic";
import { TracesModel } from "@repo/api/modules/traces/model";
import { ListsService } from "@repo/api/modules/lists/service";
import { TraceListModel } from "@repo/api/modules/lists/model";

export default new Elysia({
  prefix: "/lists",
  detail: {
    tags: ["Lists"],
    summary: "Lists module",
    description: "Endpoints for managing trace lists.",
  },
})
  .get(
    "/:traceListId",
    async ({ params: { traceListId } }) => {
      return ListsService.getList(traceListId);
    },
    {
      params: TracesModel.TracesParams,
      response: {
        200: TracesModel.TracesResponse,
        500: GenericModel.ErrorResponse,
      },
      detail: {
        summary: "Overview of trace lists",
        description: "Fetches an overview of all traces in the list.",
      },
    },
  )
  .delete(
    "/:traceListId",
    async ({ params: { traceListId } }) => {
      return ListsService.deleteTracelist(traceListId);
    },
    {
      params: TraceListModel.TraceListParams,
      response: {
        404: GenericModel.ErrorResponse,
      },
      detail: {
        summary: "Delete a tracelist.",
      },
    },
  )

  .patch(
    "/:traceListId",
    async ({
      params: { traceListId },
      body: { newName, axialCodeFeedback },
    }) => {
      return ListsService.updateTracelist(
        traceListId,
        newName,
        axialCodeFeedback,
      );
    },
    {
      params: TraceListModel.TraceListParams,
      response: {
        404: GenericModel.ErrorResponse,
      },
      body: TraceListModel.PatchTraceListBody,
      detail: {
        summary: "Rename a tracelist.",
      },
    },
  )
  .get(
    "/:traceListId/info",
    async ({ params: { traceListId } }) => {
      return ListsService.getTraceList(traceListId);
    },
    {
      params: TraceListModel.TraceListParams,
      response: {
        200: TraceListModel.TraceListResponse,
        500: GenericModel.ErrorResponse,
      },
      detail: {
        summary: "Overview of trace lists",
        description: "Fetches an overview of all traces in the list.",
      },
    },
  )
  .get(
    "/:traceListId/export",
    async ({ params: { traceListId }, set }) => {
      const data = await ListsService.exportTraceList(traceListId);
      if ("status" in data) set.status = data.status;
      return data;
    },
    {
      params: TraceListModel.TraceListParams,
      response: {
        200: TraceListModel.TraceListExportResponse,
        500: GenericModel.ErrorResponse,
      },
      detail: {
        summary: "Create trace list export",
        description: "Returns a dump of a tracelist in JSON format.",
      },
    },
  )
  .post(
    "/import",
    async ({ body }) => {
      return ListsService.importTraceList(body);
    },
    {
      body: TraceListModel.TraceListImportBody,
      response: {
        200: TraceListModel.TraceListImportResponse,
      },
      detail: {
        summary: "Import trace list",
        description: "Imports an uploaded trace list export file.",
      },
    },
  );
