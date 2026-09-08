import { t } from "elysia";

export namespace SettingsModel {
  export const ModelSettingsResponse = t.Object({
    selected: t.String(),
    available: t.Array(
      t.Object({
        id: t.String(),
        owned_by: t.String(),
      }),
    ),
  });

  export type ModelSettingsResponse = typeof ModelSettingsResponse.static;
}
