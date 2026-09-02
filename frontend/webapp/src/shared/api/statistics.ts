import { BASE_URL } from './api.ts';
import { ApiError } from '../types/ApiError.ts';
import type { ProjectStatistics, ProjectVersionStatistics } from '../types/statistics.dto.ts';

export async function getProjectStatistics(projectId: string): Promise<ProjectStatistics> {
  const url = new URL(`/v1/projects/${projectId}/statistics`, BASE_URL);

  const response = await fetch(url.toString(), { method: 'GET' });

  if (!response.ok) {
    throw new ApiError('Failed to fetch project statistics', response.status);
  }

  return response.json();
}

export async function getProjectVersionStatistics(
  projectId: string,
  versionId: string
): Promise<ProjectVersionStatistics> {
  const url = new URL(`/v1/projects/${projectId}/versions/${versionId}/statistics`, BASE_URL);

  const response = await fetch(url.toString(), { method: 'GET' });

  if (!response.ok) {
    throw new ApiError('Failed to fetch version statistics', response.status);
  }

  return response.json();
}
