export interface CreateProjectDto {
  name: string;
  description: string;
}

export interface EditProjectDto {
  projectId: string;
  name: string;
  description: string;
}
