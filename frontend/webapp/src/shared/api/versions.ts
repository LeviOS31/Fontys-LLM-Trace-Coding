import { BASE_URL } from './api.ts';
import type { CreateVersionDto, EditVersionDto } from '../types/version.dto.ts';
import type { Version } from '../types/version.ts';
import { ApiError } from '../types/ApiError.ts';

export async function createVersion(payload: CreateVersionDto): Promise<Version> {
  const url = new URL(`/v1/projects/${encodeURIComponent(payload.projectId)}/versions`, BASE_URL);
  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new ApiError('Failed to create version', response.status);
  }

  return response.json();
}

export async function editVersion(payload: EditVersionDto): Promise<Version> {
  const url = new URL(
    `/v1/projects/${encodeURIComponent(payload.projectId)}/versions/${encodeURIComponent(payload.versionId)}`,
    BASE_URL
  );
  const response = await fetch(url.toString(), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new ApiError('Failed to edit version', response.status);
  }

  return response.json();
}

export async function deleteVersion(projectId: string, versionId: string): Promise<void> {
  const url = new URL(
    `/v1/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionId)}`,
    BASE_URL
  );
  const response = await fetch(url.toString(), {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new ApiError('Failed to delete version', response.status);
  }
}
