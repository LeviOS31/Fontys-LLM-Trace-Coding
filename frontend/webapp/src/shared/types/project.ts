import type { AssessmentCriterion } from './assessmentCriterion.ts';
import type { Version } from './version';

export const PROJECT_NAME_MIN_LENGTH = 3;
export const PROJECT_NAME_MAX_LENGTH = 64;
export const PROJECT_DESCRIPTION_MAX_LENGTH = 256;

export interface Project {
  projectId: string;
  userId: string;
  name: string;
  description: string;
  versions: Version[];
  assessmentCriteria: AssessmentCriterion[];
}
