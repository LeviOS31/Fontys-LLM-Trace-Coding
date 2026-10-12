import { describe, expect, it } from 'vitest';
import type { TraceScopeSpanView } from '../../../../shared/types/trace';
import { getRetrievedSourcesForUserSpan } from './retrievalSources';

function span(
  id: string,
  name: string,
  parentId: string | null,
  attributes: { key: string; value: string }[] = []
): TraceScopeSpanView {
  return {
    traceScopeSpanId: id,
    spanKind: 'Internal',
    parentId,
    name,
    startTimeUnixNano: 1,
    endTimeUnixNano: 2,
    attributes: attributes.map((attribute) => ({
      ...attribute,
      traceAttributeType: 'String',
    })),
    events: [],
  };
}

const evidence = (items: unknown[]) => ({
  key: 'rag.retrieval.evidence',
  value: JSON.stringify(items),
  traceAttributeType: 'String',
});

describe('retrieval source association', () => {
  it('associates matching sibling retrieval evidence with a user span and groups chunks by file', () => {
    const spans = [
      span('root', 'request', null),
      span('user', 'user message', 'root'),
      span('retrieval-1', 'document retrieval', 'root', [
        { key: 'gen_ai.operation.name', value: 'retrieval' },
        { key: 'gen_ai.retrieval.query.text', value: '  explain   the source ' },
        evidence([
          {
            id: 'chunk-1',
            source_file: 'docs/guide.md',
            content: 'First excerpt',
            used_for_generation: true,
            score: 0.91,
          },
        ]),
      ]),
      span('retrieval-2', 'document retrieval', 'root', [
        { key: 'gen_ai.retrieval.query.text', value: 'explain the source' },
        evidence([
          {
            id: 'chunk-2',
            source_file: 'docs/guide.md',
            content: 'Second excerpt',
            used_for_generation: false,
          },
        ]),
      ]),
      span('unrelated', 'document retrieval', 'other-parent', [
        { key: 'gen_ai.retrieval.query.text', value: 'other question' },
        evidence([{ id: 'other', source_file: 'docs/other.md', content: 'Ignore me' }]),
      ]),
    ];

    expect(getRetrievedSourcesForUserSpan(spans, 'user', 'Explain the source')).toEqual([
      {
        sourceFile: 'docs/guide.md',
        retrievalSpanIds: ['retrieval-1', 'retrieval-2'],
        chunks: [
          {
            id: 'chunk-1',
            score: 0.91,
            content: 'First excerpt',
            usedForGeneration: true,
          },
          {
            id: 'chunk-2',
            content: 'Second excerpt',
            usedForGeneration: false,
          },
        ],
      },
    ]);
  });

  it('uses a sole sibling retrieval when its query is absent or different', () => {
    const spans = [
      span('user', 'user message', 'root'),
      span('retrieval', 'retrieval', 'root', [
        { key: 'gen_ai.retrieval.query.text', value: 'different query' },
        evidence([{ source_file: 'docs/single.md', content: 'Evidence' }]),
      ]),
    ];

    expect(getRetrievedSourcesForUserSpan(spans, 'user', 'question')).toMatchObject([
      { sourceFile: 'docs/single.md', chunks: [{ content: 'Evidence' }] },
    ]);
  });

  it('returns no evidence for unknown user spans or malformed evidence', () => {
    const spans = [
      span('retrieval', 'retrieval', null, [
        { key: 'gen_ai.operation.name', value: 'retrieval' },
        { key: 'rag.retrieval.evidence', value: 'not json' },
      ]),
    ];

    expect(getRetrievedSourcesForUserSpan(spans, 'missing', 'question')).toEqual([]);
    expect(getRetrievedSourcesForUserSpan(spans, 'retrieval', 'question')).toEqual([]);
  });

  it('returns no sources when there is no evidence matching the query', () => {
    const spans = [
      span('user', 'user message', 'root'),
      span('retrieval-1', 'retrieval', 'root', [
        { key: 'gen_ai.retrieval.query.text', value: 'different question' },
        evidence([{ source_file: 'docs/other.md', content: 'Other evidence' }]),
      ]),
      span('retrieval-2', 'retrieval', 'root', [
        { key: 'gen_ai.retrieval.query.text', value: 'another question' },
        evidence([{ source_file: 'docs/another.md', content: 'Another evidence' }]),
      ]),
    ];

    expect(getRetrievedSourcesForUserSpan(spans, 'user', 'question')).toEqual([]);
  });
});
