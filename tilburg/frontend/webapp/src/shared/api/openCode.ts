import type { VersionOpenCode } from '../types/versionOpenCode.ts';
import { BASE_URL } from './api.ts';
import { ApiError } from '../types/ApiError.ts';

export async function getOpenCodesByVersion(
  projectId: string,
  projectVersionId: string
): Promise<VersionOpenCode[]> {
  const url = new URL(`/v1/projects/${projectId}/versions/${projectVersionId}/opencodes`, BASE_URL);

  const response = await fetch(url.toString(), { method: 'GET' });

  if (!response.ok) {
    throw new ApiError(
      `Failed to fetch opencodes for version ${projectVersionId}`,
      response.status
    );
  }

  const json = await response.json();
  return json.opencodes;
}
