import { t } from "elysia";
import { TracesModel } from "@repo/api/modules/traces/model";
import { z } from "zod";

export const AxialCodeSchema = z.object({
  title: z.string().describe("Axial code Title (max 4 words)"),
  reason: z
    .string()
    .describe("The reason why you think this axial code should exist"),
  description: z
    .string()
    .describe("Explain the axial code in detail what it means."),
  feedback: z.string().describe("leave empty"),
  traceListId: z.string().describe("The given TraceList id"),
  connections: z
    .array(z.object({ traceId: z.string(), reason: z.string() }))
    .describe(
      "List of ID's (traceId) which are connected to this axial code and the reason why you connect this trace to this axial code.",
    ),
});

export const AxialCodesListSchema = z.array(AxialCodeSchema);

export type AxialCode = z.infer<typeof AxialCodeSchema>;
export type AxialCodesList = z.infer<typeof AxialCodesListSchema>;

export namespace AxialCodesModel {
  export const TraceConnection = t.Object({
    id: t.String(),
    traceId: t.String(),
    axialCodeId: t.String(),
    reason: t.String(),
    trace: TracesModel.Trace,
  });
  export const GenerateParams = t.Object({
    traceListId: t.String(),
  });

  export const llmInputObject = t.Object({
    openCode: t.String(),
    id: t.String(),
  });

  export const generateAxialCodesParams = t.Object({
    traceListId: t.String(),
    expectedAmount: t.Number(),
    jobId: t.String(),
  });

  export const AxialCode = t.Object({
    id: t.String(),
    title: t.String(),
    description: t.String(),
    reason: t.String(),
    feedback: t.String(),
    traceListId: t.Nullable(t.String()),
    connections: t.Array(TraceConnection),
  });

  export const AxialCodes = t.Array(AxialCode);

  export const llmTrace = t.Object({
    traceId: t.String(),
    reason: t.String(),
  });

  export const llmAxialCode = t.Object({
    title: t.String(),
    description: t.String(),
    reason: t.String(),
    traceListId: t.String(),
    connections: t.Array(llmTrace),
  });

  export const llmOutputObject = t.Array(llmAxialCode);

  export const UpdateAxialCodeBody = t.Object({
    title: t.String(),
    description: t.String(),
    feedback: t.String(),
  });

  export const MinimalTrace = t.Object({
    id: t.String(),
    openCode: t.Nullable(t.String()),
  });

  export const MinimalConnection = t.Object({
    reason: t.String(),
    trace: MinimalTrace,
  });

  export const MinimalAxialCode = t.Object({
    title: t.String(),
    description: t.String(),
    reason: t.String(),
    connections: t.Array(MinimalConnection),
    feedback: t.Nullable(t.String()),
  });

  export type KPIResult = {
    mostActual: { title: string; count: number; percentage: string };
    leastActual: { title: string; count: number; percentage: string };
    schemaStats: { uniqueCodes: number; avgTracesPerCode: number };
  };

  const Result = t.Object({
    title: t.String(),
    count: t.Number(),
    percentage: t.String(),
  });

  export const StatisticsResponse = t.Object({
    mostActual: Result,
    leastActual: Result,
    schemaStats: t.Object({
      uniqueCodes: t.Number(),
      avgTracesPerCode: t.Number(),
    }),
  });

  export type GenerateParams = typeof GenerateParams.static;
  export type llmInputObject = typeof llmInputObject.static;
  export type generateAxialCodesParams = typeof generateAxialCodesParams.static;
  export type AxialCode = typeof AxialCode.static;
  export type llmOutputObject = typeof llmOutputObject.static;
  export type llmAxialCode = typeof llmAxialCode.static;
  export type AxialCodes = typeof AxialCodes.static;
  export type UpdateAxialCodeBody = typeof UpdateAxialCodeBody.static;
  export type AxialCodesList = z.infer<typeof AxialCodesListSchema>;
  export type MinimalOriginalAxialCode = typeof MinimalAxialCode.static;
  export type StatisticsResponse = typeof StatisticsResponse.static;
}
