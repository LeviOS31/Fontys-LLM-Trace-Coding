import { Elysia, t } from "elysia";

import { SettingsModel } from "@repo/api/modules/settings/model";
import { SettingsService } from "@repo/api/modules/settings/service";

export default new Elysia({
  prefix: "/settings",
  detail: {
    tags: ["Settings"],
    summary: "Settings module",
    description: "Endpoints for managing settings.",
  },
})
  .get("/model", async () => SettingsService.listModelSettings(), {
    response: {
      200: SettingsModel.ModelSettingsResponse,
    },
    detail: {
      summary: "Fetch model settings",
      description: "Get current selected model and all available models.",
    },
  })
  .put(
    "/model",
    async ({ body: { model } }) => SettingsService.updateModelSetting(model),
    {
      body: t.Object({
        model: t.String(),
      }),
      response: {
        200: t.Boolean(),
      },
      detail: {
        summary: "Update model settings",
        description: "Update the currently selected model.",
      },
    },
  );
