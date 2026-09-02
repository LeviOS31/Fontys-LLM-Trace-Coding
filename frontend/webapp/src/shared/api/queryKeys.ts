export const QUERY_KEYS = {
  projects: {
    all: ['projects'],
    detail: (id: string) => ['projects', id],
  },
  traces: {
    lists: ['trace-lists'],
    list: (query: object) => ['trace-lists', query],
    detail: (traceId: string) => ['traces', traceId],
    collections: (projectVersionId: string) => ['trace-collections', projectVersionId],
  },
  settings: {
    llmStatus: ['llmStatus'],
    llmDefaultConfig: ['llmDefaultConfig'],
  },
  statistics: {
    project: (projectId: string) => ['statistics', 'project', projectId],
    version: (projectId: string, versionId: string) => [
      'statistics',
      'version',
      projectId,
      versionId,
    ],
  },
  axialCoding: {
    openCodesByVersion: (projectVersionId: string) => [
      'axial-coding',
      'opencodes',
      projectVersionId,
    ],
    currentAxialCodesOfVersion: (projectVersionId: string) => [
      'axial-coding',
      'axial-codes',
      projectVersionId,
    ],
  },
  judgeTemplates: {
    byVersion: (projectVersionId: string) => ['judge-templates', projectVersionId],
  },
};
