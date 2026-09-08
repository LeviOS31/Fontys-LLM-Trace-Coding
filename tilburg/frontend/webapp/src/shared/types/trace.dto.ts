import type { TraceCollection } from './trace';

export interface ImportTraceCollectionDto {
  projectId: string;
  projectVersionId: string;
  name: string;
  file: File;
}

export interface ImportTracesDto {
  projectVersionId: string;
  traceCollections: TraceCollection[];
}

export interface CreateTraceCollectionDto {
  projectVersionId: string;
  name: string;
}

export interface EditTraceCollectionDto {
  traceCollectionId: string;
  name: string;
}

export interface GetTraceCollectionsQuery {
  projectVersionId: string;
  page: number;
  pageSize: number;
}
