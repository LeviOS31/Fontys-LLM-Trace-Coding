import { fetch } from "bun";
import { ChatOpenAI } from "@langchain/openai";
import { prisma } from "@repo/db";
import { PromptType } from "@repo/db/generated/prisma/enums";
import { PromptService } from "@repo/api/modules/prompt/service";

type TemplateData = Record<string, any>;

export class AI {
  private setting_key: string = "selected_ai_model";

  model: ChatOpenAI;
  available_models: { id: string; owned_by: string }[] = [];

  constructor() {
    this.model = new ChatOpenAI({
      configuration: {
        baseURL: Bun.env.OPENAI_URL,
        apiKey: Bun.env.OPENAI_API_KEY,
      },
      model: Bun.env.OPENAI_MODEL!,
      temperature: 0,
      timeout: 600000,
    });
    this.setInitialModel();
  }

  async test(): Promise<void> {
    try {
      const testModel = new ChatOpenAI({
        configuration: {
          baseURL: Bun.env.OPENAI_URL,
          apiKey: Bun.env.OPENAI_API_KEY,
        },
        model: this.model.model,
        temperature: 0,
        maxTokens: 1,
        reasoning: {
          effort: "none",
        },
      });

      await testModel.invoke(
        [
          {
            role: "human",
            content: "",
          },
        ],
        {
          timeout: 30000,
        },
      );

      return;
    } catch (e: any) {
      const status = e?.status || e?.response?.status;
      const message = e?.message || "";

      if (status === 401) {
        throw Error("Invalid OpenAI API Key (401 Unauthorized)");
      }
      if (status === 404) {
        throw Error(
          `Invalid OpenAI Model or URL: Model '${Bun.env.OPENAI_MODEL}' not found at ${Bun.env.OPENAI_URL}`,
        );
      }
      if (status === 403) {
        throw Error(
          `Permission denied (403): No access to model: '${Bun.env.OPENAI_MODEL}'`,
        );
      }
      if (message.includes("ECONNREFUSED") || message.includes("ENOTFOUND")) {
        throw Error(
          `Invalid OpenAI url: Cannot connect to: ${Bun.env.OPENAI_URL}`,
        );
      }

      throw Error(`LangChain/OpenAI error: ${message}`);
    }
  }

  async setInitialModel() {
    try {
      const key = await prisma.setting.findUnique({
        where: {
          key: this.setting_key,
        },
        select: {
          value: true,
        },
      });

      await this.fetchModels();

      if (key) {
        this.switchModel(key.value);
      } else {
        this.switchModel(Bun.env.OPENAI_MODEL!);
      }
    } catch {
      // DB not available on startup (e.g. tests) — use env default
    }
  }

  async fetchModels(): Promise<void> {
    try {
      const response = await fetch(`${Bun.env.OPENAI_URL}/models`, {
        headers: {
          Authorization: `Bearer ${Bun.env.OPENAI_API_KEY}`,
        },
      });

      if (!response.ok) throw new Error(`Error: ${response.status}`);
      const models = await response.json();

      if (models && Array.isArray(models.data)) {
        this.available_models = models.data.map(
          (model: { id: string; owned_by: string }) => ({
            id: model.id,
            owned_by: model.owned_by,
          }),
        );
      } else {
        this.available_models = [];
      }
    } catch (error) {
      console.error("Error fetching models:", error);
      this.available_models = [];
    }
  }

  async switchModel(model: string): Promise<boolean> {
    if (!this.available_models.map((model) => model.id).includes(model)) {
      const fallbackModel =
        this.available_models.length >= 1 ? this.available_models[0].id : "";
      await this.saveSetting(fallbackModel);
      this.model.model = fallbackModel;
      return false;
    }

    await this.saveSetting(model);
    this.model = new ChatOpenAI({
      configuration: {
        baseURL: Bun.env.OPENAI_URL,
        apiKey: Bun.env.OPENAI_API_KEY,
      },
      temperature: 0,
      timeout: 600000,
      model,
    });
    return true;
  }

  async saveSetting(model: string): Promise<void> {
    await prisma.setting.upsert({
      where: {
        key: this.setting_key,
      },
      update: {
        value: model,
      },
      create: {
        key: this.setting_key,
        value: model,
      },
    });
  }

  async renderPrompt(type: PromptType, data: TemplateData): Promise<string> {
    const template = await PromptService.getPromptByType(type);

    return template.text
      .replace(/{{\s*([^}]+)\s*}}/g, (_, path) => {
        const parts = path.split(".").map((p: string) => p.trim());
        let val: any = data;
        for (const part of parts) {
          if (val == null) return "";
          val = val[part];
        }
        return val == null ? `{{${parts.join(".")}}}` : String(val);
      })
      .trim();
  }
}

export const ai = new AI();
