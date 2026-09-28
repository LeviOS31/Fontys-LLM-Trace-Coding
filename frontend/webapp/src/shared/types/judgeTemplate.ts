export interface JudgeTemplate {
  id: string;
  axialCodeId: string;
  name: string;
  description: string;
  template: string;
  isDeprecated: boolean;
  currentVersionNumber?: number;
}

export interface GetJudgeTemplatesResponse {
  judgeTemplates: JudgeTemplate[];
}

export interface CreateJudgeTemplatePayload {
  name: string;
  description: string;
}

export interface CreateJudgeTemplateResponse {
  judgeTemplateId: string;
}

export interface UpdateJudgeTemplatePayload {
  content: string;
}

export interface JudgeTemplateVersion {
  versionNumber: number;
  content: string;
  createdAt: string;
}

export interface GetJudgeTemplateVersionsResponse {
  versions: JudgeTemplateVersion[];
}

