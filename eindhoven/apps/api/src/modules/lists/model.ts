import { t } from "elysia";
import { TracesModel } from "@repo/api/modules/traces/model";

export namespace TraceListModel {
  export const TraceList = t.Object({
    id: t.String({ format: "uuid" }),
    createdAt: t.Date(),
    completedAt: t.Nullable(t.Date()),
    name: t.String(),
  });
  export const TraceListResponse = t.Object({
    id: t.String({ format: "uuid" }),
    createdAt: t.Date(),
    completedAt: t.Nullable(t.Date()),
    name: t.String(),
    axialCodeFeedback: t.String(),
    status: t.Object({
      positive: t.Number(),
      negative: t.Number(),
      pending: t.Number(),
    }),
    axialCodes: t.Array(
      t.Object({
        name: t.String(),
        traceAmount: t.Number(),
      }),
    ),
  });
  export const ProjectTraceListsResponse = t.Array(TraceListResponse);

  export const TraceListParams = t.Object({
    traceListId: t.String(),
  });

  export const PatchTraceListBody = t.Object({
    newName: t.String(),
    axialCodeFeedback: t.String(),
  });

  export type PatchTraceListBody = typeof PatchTraceListBody.static;
  export type TraceListParams = typeof TraceListParams.static;
  export type TraceList = typeof TraceList.static;
  export type TraceListResponse = typeof TraceListResponse.static;
  export type ProjectTraceListsResponse =
    typeof ProjectTraceListsResponse.static;

  export const TraceExport = t.Object({
    id: t.String(),
    parentId: t.Nullable(t.String()),
    name: t.Nullable(t.String()),
    system: t.Nullable(t.String()),
    input: t.String(),
    output: t.String(),
    openCode: t.Nullable(t.String()),
    context: t.Nullable(t.String()),
    feedback: t.Nullable(TracesModel.Feedback),
    isFlagged: t.Boolean(),
  });

  export const AxialCodeExport = t.Object({
    title: t.String(),
    description: t.String(),
    reason: t.String(),
    traces: t.Array(
      t.Object({
        traceId: t.String(),
        reason: t.String(),
      }),
    ),
  });

  export const TraceListExportResponse = t.Object({
    name: t.String(),
    createdAt: t.Date(),
    traces: t.Array(TraceExport),
    axialCodes: t.Array(AxialCodeExport),
  });

  export type TraceListExportResponse = typeof TraceListExportResponse.static;

  export const TraceListImportBody = t.Object({
    export: t.File(),
    projectId: t.String(),
  });

  export type TraceListImportBody = typeof TraceListImportBody.static;

  export const TraceListImportResponse = t.Object({
    success: t.Boolean({ default: false }),
    id: t.Nullable(t.String()),
  });

  export type TraceListImportResponse = typeof TraceListImportResponse.static;
}
