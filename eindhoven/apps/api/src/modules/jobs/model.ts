import { t } from "elysia";

export enum JobStatus {
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export namespace JobModel {
  export const JobModel = t.Object({
    id: t.String(),
    status: t.Enum(JobStatus),
    error: t.Nullable(t.String()),
    metadata: t.Record(t.String(), t.Any()),
    createdAt: t.Date(),
    updatedAt: t.Date(),
  });

  export const JobsModel = t.Array(JobModel);

  export type Job = typeof JobModel.static;
  export type Jobs = typeof JobsModel.static;
}
