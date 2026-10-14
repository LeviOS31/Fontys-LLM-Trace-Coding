import type { TraceScopeSpanView } from '../../../../shared/types/trace';

export type RetrievedChunk = {
  id?: string;
  score?: number;
  content: string;
  usedForGeneration: boolean;
};

export type RetrievedSource = {
  sourceFile: string;
  retrievalSpanIds: string[];
  chunks: RetrievedChunk[];
};

type RetrievalEvidence = {
  id?: unknown;
  score?: unknown;
  source_file?: unknown;
  content?: unknown;
  used_for_generation?: unknown;
};

type RetrievalDocument = {
  id?: unknown;
  score?: unknown;
};

function getAttribute(span: TraceScopeSpanView, key: string): string | undefined {
  return span.attributes.find((attribute) => attribute.key === key)?.value;
}

function isRetrievalSpan(span: TraceScopeSpanView): boolean {
  return (
    span.name.toLowerCase().includes('retriev') ||
    getAttribute(span, 'gen_ai.operation.name') === 'retrieval' ||
    getAttribute(span, 'rag.retrieval.evidence') !== undefined
  );
}

function normalizeQuery(query: string | undefined): string {
  return query?.trim().replace(/\s+/g, ' ').toLocaleLowerCase() ?? '';
}

function parseEvidence(span: TraceScopeSpanView): RetrievalEvidence[] {
  const rawEvidence = getAttribute(span, 'rag.retrieval.evidence');
  if (!rawEvidence) return [];

  try {
    const evidence: unknown = JSON.parse(rawEvidence);
    return Array.isArray(evidence)
      ? evidence.filter(
          (item): item is RetrievalEvidence => typeof item === 'object' && item !== null
        )
      : [];
  } catch {
    return [];
  }
}

function parseDocuments(span: TraceScopeSpanView): RetrievalDocument[] {
  const rawDocuments = getAttribute(span, 'gen_ai.retrieval.documents');
  if (!rawDocuments) return [];

  try {
    const documents: unknown = JSON.parse(rawDocuments);
    return Array.isArray(documents)
      ? documents.filter(
          (item): item is RetrievalDocument => typeof item === 'object' && item !== null
        )
      : [];
  } catch {
    return [];
  }
}

function groupRetrievedSources(retrievalSpans: TraceScopeSpanView[]): RetrievedSource[] {
  const sources = new Map<string, RetrievedSource>();
  for (const retrievalSpan of retrievalSpans) {
    const documents = parseDocuments(retrievalSpan);
    const documentsById = new Map<string, RetrievalDocument>();
    for (const document of documents) {
      if (typeof document.id === 'string') documentsById.set(document.id, document);
    }
    for (const [index, item] of parseEvidence(retrievalSpan).entries()) {
      if (typeof item.source_file !== 'string' || !item.source_file.trim()) continue;

      let source = sources.get(item.source_file);
      if (!source) {
        source = {
          sourceFile: item.source_file,
          retrievalSpanIds: [],
          chunks: [],
        };
        sources.set(item.source_file, source);
      }
      if (!source.retrievalSpanIds.includes(retrievalSpan.traceScopeSpanId)) {
        source.retrievalSpanIds.push(retrievalSpan.traceScopeSpanId);
      }

      const document =
        (typeof item.id === 'string' ? documentsById.get(item.id) : undefined) ?? documents[index];
      const chunkId =
        typeof item.id === 'string'
          ? item.id
          : typeof document?.id === 'string'
            ? document.id
            : undefined;
      if (chunkId && source.chunks.some((chunk) => chunk.id === chunkId)) continue;
      source.chunks.push({
        ...(chunkId ? { id: chunkId } : {}),
        ...(typeof item.score === 'number'
          ? { score: item.score }
          : typeof document?.score === 'number'
            ? { score: document.score }
            : {}),
        content: typeof item.content === 'string' ? item.content : '',
        usedForGeneration: item.used_for_generation === true,
      });
    }
  }
  return [...sources.values()];
}

export function getRetrievedSourcesForRetrievalSpan(span: TraceScopeSpanView): RetrievedSource[] {
  return groupRetrievedSources([span]);
}

export function getRetrievedSourcesForUserSpan(
  spans: TraceScopeSpanView[],
  userSpanId: string,
  userContent: string
): RetrievedSource[] {
  const userSpan = spans.find((span) => span.traceScopeSpanId === userSpanId);
  if (!userSpan) return [];

  const retrievalSpans = spans.filter(
    (span) => isRetrievalSpan(span) && parseEvidence(span).length > 0
  );
  const siblingRetrievals = userSpan.parentId
    ? retrievalSpans.filter((span) => span.parentId === userSpan.parentId)
    : [];
  const query = normalizeQuery(userContent);
  const queryMatches = (candidates: TraceScopeSpanView[]) =>
    query
      ? candidates.filter(
          (span) => normalizeQuery(getAttribute(span, 'gen_ai.retrieval.query.text')) === query
        )
      : [];

  let matchedSpans = queryMatches(siblingRetrievals);
  if (matchedSpans.length === 0 && siblingRetrievals.length === 1) {
    matchedSpans = siblingRetrievals;
  }
  if (matchedSpans.length === 0 && siblingRetrievals.length === 0) {
    matchedSpans = queryMatches(retrievalSpans);
  }
  return groupRetrievedSources(matchedSpans);
}
