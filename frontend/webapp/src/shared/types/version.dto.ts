export interface CreateVersionDto {
  projectId: string;
  name: string;
  description: string;
}

export interface EditVersionDto {
  projectId: string;
  versionId: string;
  name: string;
  description: string;
}
