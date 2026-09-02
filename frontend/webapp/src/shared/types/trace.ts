export const TRACE_COLLECTION_NAME_MIN_LENGTH = 3;
export const TRACE_COLLECTION_NAME_MAX_LENGTH = 64;

export type TraceMessageType = 'Prompt' | 'Completion';
export type TraceAttributeType = 'String' | 'Int' | 'Double' | 'Bool';

// Summary — returned by GET /v1/traces (list)
export interface TraceGroupSummaryItem {
  traceGroupId: string;
  groupTitle: string;
  collectionName: string;
  collectionCreatedAt: string;
  traceCount: number;
  amountOfSpans: number;
  amountOfOpenCodes: number;
  amountOfAxialCodes: number;
  needsAxialCodeUpdate: boolean;
}

export type TraceGroupType = 'LlmGroup' | 'OtherGroup';

export interface SpanAttributeView {
  key: string;
  value: string;
  traceAttributeType: TraceAttributeType;
}

export interface TraceResourceView {
  key: string;
  value: string;
  traceAttributeType: TraceAttributeType;
}

export interface SpanEventView {
  timeUnixNano: number;
  name: string;
  attributes: SpanAttributeView[];
}

export type SpanKind = 'Unspecified' | 'Internal' | 'Server' | 'Client' | 'Producer' | 'Consumer';

export interface TraceScopeSpanView {
  traceScopeSpanId: string;
  spanKind: SpanKind;
  parentId: string | null;
  name: string;
  startTimeUnixNano: number;
  endTimeUnixNano: number;
  attributes: SpanAttributeView[];
  events: SpanEventView[];
}

export interface TraceScopesView {
  name: string;
  version: string;
  spans: TraceScopeSpanView[];
}

export interface TraceDetailView {
  traceId: string;
  traceCollectionId: string;
  collectionName: string;
  collectionCreatedAt: string;
  traceResources: TraceResourceView[];
  traceScopes: TraceScopesView[];
  openCode?: string;
  updatedAt: string;
}

// Detail — returned by GET /v1/projects/{projectId}/versions/{versionId}/traceGroup/{traceGroupId}
export interface TraceGroupDetail {
  traceGroupId: string;
  traceGroupType: TraceGroupType;
  traces: TraceDetailView[];
}

export interface GetTracesQuery {
  projectVersionId: string;
  page: number;
  pageSize: number;
  filters?: string[];
}

export interface TraceCollection {
  traceCollectionId: string;
  projectVersionId: string;
  name: string;
  createdAt: string;
  traces: Trace[];
}

export interface TraceCollectionOverview {
  traceCollectionId: string;
  name: string;
  tracersCount: number;
  createdAt: string;
}

export interface Trace {
  traceId: string;
  traceCollectionId: string;
  traceGroupId: string;
  traceScopes: Array<{
    scopeId: string;
    name: string;
    version: string;
    spans: Array<{
      spanId: string;
      parentSpanId?: string;
      name: string;
      startTimeUnixNano: number;
      endTimeUnixNano: number;
      spanKind: number;
      attributes: Array<{
        key: string;
        value: string;
        attributeType: number;
      }>;
      events: Array<{
        eventId: string;
        timeUnixNano: number;
        name: string;
        attributes: Array<{
          key: string;
          value: string;
          attributeType: number;
        }>;
      }>;
    }>;
  }>;
  traceResources: Array<{
    key: string;
    value: string;
    attributeType: number;
  }>;
}
