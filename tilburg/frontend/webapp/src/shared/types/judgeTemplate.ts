export interface JudgeTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  isDeprecated: boolean;
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
