import type {
  AssessmentCriterionDto,
  CreateAssessmentCriterionDto,
  DeleteAssessmentCriterionDto,
  UpdateAssessmentCriterionDto,
} from '../types/assessmentCriterionDto.ts';
import { BASE_URL } from './api';

export async function createAssessmentCriterion(
  payload: CreateAssessmentCriterionDto
): Promise<AssessmentCriterionDto> {
  const url = new URL(`/v1/projects/${payload.projectId}/assessment-criteria`, BASE_URL);
  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      criterion: payload.criterion,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create assessment criterion');
  }

  return response.json();
}

export async function updateAssessmentCriterion(
  payload: UpdateAssessmentCriterionDto
): Promise<AssessmentCriterionDto> {
  const url = new URL(
    `/v1/projects/${payload.projectId}/assessment-criteria/${payload.criterionId}`,
    BASE_URL
  );
  const response = await fetch(url.toString(), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      criterion: payload.criterion,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to update assessment criterion');
  }

  return response.json();
}

export async function deleteAssessmentCriterion(
  payload: DeleteAssessmentCriterionDto
): Promise<void> {
  const url = new URL(
    `/v1/projects/${payload.projectId}/assessment-criteria/${payload.criterionId}`,
    BASE_URL
  );
  const response = await fetch(url.toString(), {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete assessment criterion');
  }
}
