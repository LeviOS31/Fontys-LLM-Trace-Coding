export interface LlmStatus {
  providerName?: string;
  endpoint?: string;
  modelName?: string;
  isConnected?: boolean;
}

export interface LlmConfig {
  providerName: string | null;
  endpoint: string | null;
  modelName: string | null;
}

export interface SetLlmConfigDto {
  providerName: string | null;
  endpoint: string | null;
  modelName: string | null;
}
