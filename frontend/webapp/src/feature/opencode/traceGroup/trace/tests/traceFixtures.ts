import type { TraceDetailView, TraceScopeSpanView } from '../../../../../shared/types/trace';

export function createSpan(
  traceScopeSpanId: string,
  name: string,
  overrides: Partial<TraceScopeSpanView> = {}
): TraceScopeSpanView {
  return {
    traceScopeSpanId,
    spanKind: 'Internal',
    parentId: null,
    name,
    startTimeUnixNano: 1_000_000,
    endTimeUnixNano: 2_000_000,
    attributes: [],
    events: [],
    ...overrides,
  };
}

export function createTrace(
  spans: TraceScopeSpanView[] = [],
  overrides: Partial<TraceDetailView> = {}
): TraceDetailView {
  return {
    traceId: 'trace-1',
    traceCollectionId: 'collection-1',
    collectionName: 'Test collection',
    collectionCreatedAt: '2026-01-01T00:00:00.000Z',
    traceResources: [],
    traceScopes: [{ name: 'test-scope', version: '1.0', spans }],
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function stringAttribute(key: string, value: string) {
  return { key, value, traceAttributeType: 'String' as const };
}
