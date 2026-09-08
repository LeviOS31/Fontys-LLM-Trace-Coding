export interface CreateAssessmentCriterionDto {
  projectId: string;
  criterion: string;
}

export interface UpdateAssessmentCriterionDto {
  projectId: string;
  criterionId: string;
  criterion: string;
}

export interface AssessmentCriterionDto {
  criterionId: string;
  projectId: string;
  criterion: string;
}

export interface DeleteAssessmentCriterionDto {
  projectId: string;
  criterionId: string;
}
