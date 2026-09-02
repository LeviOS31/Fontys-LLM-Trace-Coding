export const VERSION_NAME_MIN_LENGTH = 2;
export const VERSION_NAME_MAX_LENGTH = 64;
export const VERSION_DESCRIPTION_MAX_LENGTH = 256;

export interface Version {
  versionId: string;
  projectId: string;
  name: string;
  description: string;
}
