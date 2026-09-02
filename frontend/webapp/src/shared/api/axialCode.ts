import { BASE_URL } from './api.ts';
import type { AxialCode } from '../types/axialCode.ts';
import { ApiError } from '../types/ApiError.ts';

export interface GenerateAxialCodesDto {
  feedback: string | null;
  axialCodes: AxialCode[] | null;
}

export interface AxialCodingResultResponse {
  axialCodingResultId: string;
  axialCodes: AxialCode[];
}

export async function generateAxialCodingResults(
  projectId: string,
  projectVersionId: string,
  payload: GenerateAxialCodesDto
): Promise<AxialCodingResultResponse> {
  const url = new URL(
    `/v1/projects/${projectId}/versions/${projectVersionId}/axial-coding-results/generate`,
    BASE_URL
  );

  const normalizedPayload: GenerateAxialCodesDto = {
    feedback: payload.feedback ?? null,
    axialCodes: payload.axialCodes ?? null,
  };

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(normalizedPayload),
  });

  if (!response.ok) {
    throw new ApiError('Failed to generate axial coding results', response.status);
  }

  if (response.status === 204) {
    return { axialCodingResultId: '', axialCodes: [] };
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return { axialCodingResultId: '', axialCodes: [] };
  }

  const json = await response.json();
  const axialCodes = Array.isArray(json) ? json : (json.axialCodes ?? json.axialcodes ?? []);
  const axialCodingResultId = json.axialCodingResultId ?? json.id ?? '';
  return { axialCodingResultId, axialCodes };
}

export async function saveAxialCodingResults(
  projectId: string,
  projectVersionId: string,
  axialCodingResultId: string
): Promise<void> {
  const url = new URL(
    `/v1/projects/${projectId}/versions/${projectVersionId}/axial-coding-results/${axialCodingResultId}/save`,
    BASE_URL
  );

  const response = await fetch(url.toString(), { method: 'POST' });

  if (!response.ok) {
    throw new ApiError('Failed to save axial coding results', response.status);
  }
}

export interface CurrentAxialCodesResponse {
  axialCodes: AxialCode[];
  createdAt: string | null;
}

export async function getCurrentAxialCodesOfVersion(
  projectId: string,
  projectVersionId: string
): Promise<CurrentAxialCodesResponse> {
  const url = new URL(
    `/v1/projects/${projectId}/versions/${projectVersionId}/axial-coding-results/current`,
    BASE_URL
  );

  const response = await fetch(url.toString(), { method: 'GET' });

  if (!response.ok) {
    throw new ApiError(
      `Failed to fetch axial codes for version ${projectVersionId}`,
      response.status
    );
  }

  const json = await response.json();

  return {
    axialCodes: Array.isArray(json) ? json : (json.axialCodes ?? json.axialcodes ?? []),
    createdAt: json.createdAt ?? null,
  };
}
