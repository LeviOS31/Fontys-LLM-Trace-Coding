import { t } from "elysia";

export const Status = t.Union([t.Literal("ok"), t.Literal("error")]);
export type Status = typeof Status.static;

export const StatusResponse = t.Object({
  status: Status,
  revalidateAfter: t.Date(),
});
export type StatusResponse = typeof StatusResponse.static;
