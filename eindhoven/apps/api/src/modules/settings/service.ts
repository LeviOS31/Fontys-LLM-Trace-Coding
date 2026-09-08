import { ai } from "@repo/api/lib/llm-client";
import { SettingsModel } from "@repo/api/modules/settings/model";

export abstract class SettingsService {
  static async listModelSettings(): Promise<SettingsModel.ModelSettingsResponse> {
    await ai.fetchModels();
    return {
      selected: ai.model.model,
      available: ai.available_models,
    };
  }

  static updateModelSetting(model: string) {
    return ai.switchModel(model);
  }
}
