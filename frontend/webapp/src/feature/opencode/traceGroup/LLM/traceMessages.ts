import type { TraceDetailView } from '../../../../shared/types/trace';
import { extractSpanMessages } from '../trace/GenAIMessages';
import { getRetrievedSourcesForUserSpan, type RetrievedSource } from '../trace/retrievalSources';

export type LlmRole = 'user' | 'assistant' | 'system';

export type LlmMessage = {
  role: LlmRole;
  content: string;
  index: number;
  relatedTraceId: string;
  relatedSpanId: string;
  modelName?: string;
  amountOfSpans?: number;
  retrievedSources?: RetrievedSource[];
};

type TraceMessageSource = Pick<TraceDetailView, 'traceId' | 'traceScopes'>;

function mergeRetrievedSources(
  current: RetrievedSource[] = [],
  added: RetrievedSource[] = []
): RetrievedSource[] {
  const sources = new Map(current.map((source) => [source.sourceFile, source]));
  for (const source of added) {
    const existing = sources.get(source.sourceFile);
    if (!existing) {
      sources.set(source.sourceFile, source);
      continue;
    }
    existing.retrievalSpanIds = [
      ...new Set([...existing.retrievalSpanIds, ...source.retrievalSpanIds]),
    ];
    for (const chunk of source.chunks) {
      if (!chunk.id || !existing.chunks.some((currentChunk) => currentChunk.id === chunk.id)) {
        existing.chunks.push(chunk);
      }
    }
  }
  return [...sources.values()];
}

export function getLlmMessages(traces: TraceMessageSource[] = []): LlmMessage[] {
  const messages: LlmMessage[] = [];

  for (const trace of traces) {
    const spans = trace.traceScopes.flatMap((scope) => scope.spans);
    const amountOfSpans = spans.length;
    const outputOnly: LlmMessage[] = [];

    for (const span of spans) {
      const extracted = extractSpanMessages(span.attributes);
      if (!extracted) continue;

      const modelName =
        span.attributes.find((attribute) => attribute.key === 'gen_ai.request.model')?.value ||
        span.attributes.find((attribute) => attribute.key === 'gen_ai.response.model')?.value;

      extracted.messages.forEach((message, index) => {
        const entry: LlmMessage = {
          ...message,
          index,
          relatedTraceId: trace.traceId,
          relatedSpanId: span.traceScopeSpanId,
          modelName,
          amountOfSpans,
          ...(message.role === 'user'
            ? {
                retrievedSources: getRetrievedSourcesForUserSpan(
                  spans,
                  span.traceScopeSpanId,
                  message.content
                ),
              }
            : {}),
        };
        if (!extracted.hasInput) {
          outputOnly.push(entry);
          return;
        }

        const duplicate = messages.find(
          (existing) =>
            existing.content === entry.content &&
            existing.role === entry.role &&
            existing.index === entry.index
        );
        if (duplicate) {
          duplicate.retrievedSources = mergeRetrievedSources(
            duplicate.retrievedSources,
            entry.retrievedSources
          );
        } else {
          messages.push(entry);
        }
      });
    }

    for (const entry of outputOnly) {
      const duplicate = messages.some(
        (existing) => existing.content === entry.content && existing.role === entry.role
      );
      if (!duplicate) messages.push(entry);
    }
  }

  return messages;
}
