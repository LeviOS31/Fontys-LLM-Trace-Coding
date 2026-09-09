import { BASE_URL } from './api.ts';
import type { ImportTraceCollectionDto } from '../types/trace.dto.ts';
import type {
  GetTracesQuery,
  TraceCollectionOverview,
  TraceGroupDetail,
  TraceGroupSummaryItem,
} from '../types/trace.ts';
import type { PagedResult } from '../types/pagination.ts';
import { ApiError } from '../types/ApiError.ts';
import type { CreateOpencodeDto } from '../types/opencode.dto.ts';

export async function importTraceCollection(payload: ImportTraceCollectionDto): Promise<void> {
  const url = new URL(
    `/v1/projects/${payload.projectId}/versions/${payload.projectVersionId}/traces`,
    BASE_URL
  );
  const formData = new FormData();

  formData.append('projectVersionId', payload.projectVersionId);
  formData.append('name', payload.name);
  formData.append('file', payload.file);

  const response = await fetch(url.toString(), {
    method: 'POST',
    body: formData,
    // Content type is set automatically to multipart/form-data with the correct boundary when using FormData
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(details || `Import failed with status ${response.status}`);
  }
}

export async function addOpencode(
  projectId: string,
  projectVersionId: string,
  traceId: string,
  payload: CreateOpencodeDto
): Promise<void> {
  const url = new URL(
    `/v1/projects/${projectId}/versions/${projectVersionId}/traces/${traceId}`,
    BASE_URL
  );

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to save opencode');
  }
}

// Helper functions

function buildTracesUrl(projectId: string, query: GetTracesQuery): string {
  const url = new URL(
    `/v1/projects/${projectId}/versions/${query.projectVersionId}/traces`,
    BASE_URL
  );

  // Note: Backend expects 'page' and 'pageSize' as query params
  url.searchParams.set('page', query.page.toString());
  url.searchParams.set('pageSize', query.pageSize.toString());

  if (query.filters) url.searchParams.set('filters', query.filters.join('&'));

  return url.toString();
}
//

// API functions

export async function getTraces(
  projectId: string,
  query: GetTracesQuery
): Promise<PagedResult<TraceGroupSummaryItem>> {
  const response = await fetch(buildTracesUrl(projectId, query), { method: 'GET' });
  if (!response.ok) throw new ApiError('Failed to fetch traces', response.status);
  return await response.json();
}
export async function getTraceCollections(
  projectId: string,
  versionId: string
): Promise<TraceCollectionOverview[]> {
  const url = new URL(
    `/v1/projects/${projectId}/versions/${versionId}/traces/collections`,
    BASE_URL
  );

  const response = await fetch(url.toString(), {
    method: 'GET',
  });

  if (!response.ok) {
    throw new ApiError(
      `Failed to fetch trace collection with ProjectId: ${projectId} and VersionId: ${versionId}`,
      response.status
    );
  }

  const body = await response.json();
  return body.traceCollections;
}

export async function getTraceGroup(
  projectId: string,
  projectVersionId: string,
  traceGroupId: string
): Promise<TraceGroupDetail> {
  // Matches: /v1/projects/{projectId}/versions/{versionId}/traces/{traceGroupId}
  const url = new URL(
    `/v1/projects/${projectId}/versions/${projectVersionId}/traceGroup/${traceGroupId}`,
    BASE_URL
  );

  const response = await fetch(url.toString(), { method: 'GET' });
  if (!response.ok) throw new ApiError('Failed to fetch trace', response.status);
  return await response.json();
}

export async function deleteCollection(
  projectId: string,
  versionId: string,
  collectionId: string
): Promise<void> {
  const url = new URL(
    `/v1/projects/${projectId}/versions/${versionId}/traces/collections/${collectionId}`,
    BASE_URL
  );
  const response = await fetch(url.toString(), {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new ApiError(
      `Failed to delete trace collection with ProjectId: ${projectId} and VersionId: ${versionId} and CollectionId: ${collectionId}`,
      response.status
    );
  }
}

export async function editTraceCollection(
  projectId: string,
  versionId: string,
  collectionId: string,
  payload: string
): Promise<void> {
  const url = new URL(
    `/v1/projects/${projectId}/versions/${versionId}/traces/collections/${collectionId}`,
    BASE_URL
  );

  const response = await fetch(url.toString(), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: payload,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to edit trace collection');
  }
}
