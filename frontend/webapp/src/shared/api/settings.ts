import { BASE_URL } from './api.ts';
import { ApiError } from '../types/ApiError.ts';
import type { LlmConfig, LlmStatus, SetLlmConfigDto } from '../types/settings.ts';

export async function getLlmStatus(): Promise<LlmStatus> {
  const url = new URL(`/v1/settings/llm/status`, BASE_URL);

  const response = await fetch(url.toString(), {
    method: 'GET',
  });

  if (!response.ok) {
    throw new ApiError(`Failed to fetch llm status`, response.status);
  }

  return response.json();
}

export async function setLlmConfig(payload: SetLlmConfigDto): Promise<LlmConfig> {
  const url = new URL(`/v1/settings/llm/config`, BASE_URL);

  const response = await fetch(url.toString(), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new ApiError(`Failed to update llm config`, response.status);
  }

  return response.json();
}

export async function getDefaultLlmConfig(): Promise<LlmStatus> {
  const url = new URL(`/v1/settings/llm/default-config`, BASE_URL);

  const response = await fetch(url.toString(), {
    method: 'GET',
  });

  if (!response.ok) {
    throw new ApiError(`Failed to fetch default llm config`, response.status);
  }

  return response.json();
}
