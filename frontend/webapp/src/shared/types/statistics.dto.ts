export interface AxialCodeItem {
  label: string;
  description: string;
  openCodeCount: number;
}

export interface ProjectStatistics {
  totalTraceCount: number;
  versionTotalTraceCount: Record<string, number>;
  totalOpenCodeCount: number;
  totalAxialCodeCount: number;
  versionAxialCodes: Record<string, AxialCodeItem[]>;
}

export interface ProjectVersionStatistics {
  versionTraceCount: number;
  versionOpenCodeCount: number;
  versionAxialCodeCount: number;
  versionAxialCodes: AxialCodeItem[];
}
