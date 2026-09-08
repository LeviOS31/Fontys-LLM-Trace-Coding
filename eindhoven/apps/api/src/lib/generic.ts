import { t } from "elysia";

export namespace GenericModel {
  export const ErrorResponse = t.Object({
    message: t.String(),
    status: t.Number(),
  });
  export type ErrorResponse = typeof ErrorResponse.static;

  export const SuccessResponse = t.Object({
    success: t.Boolean(),
    message: t.Optional(t.String()),
  });
  export type SuccessResponse = typeof SuccessResponse.static;
}
