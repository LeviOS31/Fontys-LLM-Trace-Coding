import { BASE_URL } from './api.ts';
import type {
  CreateJudgeTemplatePayload,
  CreateJudgeTemplateResponse,
  GetJudgeTemplatesResponse,
  UpdateJudgeTemplatePayload,
  GetJudgeTemplateVersionsResponse,
} from '../types/judgeTemplate.ts';

export async function getJudgeTemplates(
  projectId: string,
  projectVersionId: string
): Promise<GetJudgeTemplatesResponse> {
  const url = new URL(
    `/v1/projects/${projectId}/versions/${projectVersionId}/judge-templates`,
    BASE_URL
  );
  const response = await fetch(url.toString());
  if (!response.ok) throw new Error('Failed to fetch judge templates');
  return response.json();
}

export async function deleteJudgeTemplate(
  projectId: string,
  projectVersionId: string,
  judgeTemplateId: string
): Promise<void> {
  const url = new URL(
    `/v1/projects/${projectId}/versions/${projectVersionId}/judge-templates/${judgeTemplateId}`,
    BASE_URL
  );
  const response = await fetch(url.toString(), { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to delete judge template');
}

export async function createJudgeTemplate(
  projectId: string,
  projectVersionId: string,
  axialCodeId: string,
  payload: CreateJudgeTemplatePayload
): Promise<CreateJudgeTemplateResponse> {
  const url = new URL(
    `/v1/projects/${projectId}/versions/${projectVersionId}/axial-codes/${axialCodeId}/judge-template`,
    BASE_URL
  );
  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to create judge template');
  return response.json();
}

export async function updateJudgeTemplate(
  projectId: string,
  projectVersionId: string,
  judgeTemplateId: string,
  payload: UpdateJudgeTemplatePayload
): Promise<void> {
  const url = new URL(
    `/v1/projects/${projectId}/versions/${projectVersionId}/judge-templates/${judgeTemplateId}`,
    BASE_URL
  );
  const response = await fetch(url.toString(), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to update judge template');
}

export async function getJudgeTemplateVersions(
  projectId: string,
  projectVersionId: string,
  judgeTemplateId: string
): Promise<GetJudgeTemplateVersionsResponse> {
  const url = new URL(
    `/v1/projects/${projectId}/versions/${projectVersionId}/judge-templates/${judgeTemplateId}/versions`,
    BASE_URL
  );
  const response = await fetch(url.toString());
  if (!response.ok) throw new Error('Failed to fetch judge template versions');
  return response.json();
}

export async function deleteJudgeTemplateVersion(
  projectId: string,
  projectVersionId: string,
  judgeTemplateId: string,
  versionNumber: number
): Promise<void> {
  const url = new URL(
    `/v1/projects/${projectId}/versions/${projectVersionId}/judge-templates/${judgeTemplateId}/versions/${versionNumber}`,
    BASE_URL
  );
  const response = await fetch(url.toString(), { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to delete judge template version');
}

export async function restoreJudgeTemplateVersion(
  projectId: string,
  projectVersionId: string,
  judgeTemplateId: string,
  versionNumber: number
): Promise<void> {
  const url = new URL(
    `/v1/projects/${projectId}/versions/${projectVersionId}/judge-templates/${judgeTemplateId}/versions/${versionNumber}/restore`,
    BASE_URL
  );
  const response = await fetch(url.toString(), { method: 'POST' });
  if (!response.ok) throw new Error('Failed to restore judge template version');
}
