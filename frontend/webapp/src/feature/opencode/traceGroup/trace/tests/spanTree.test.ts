import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';
import { createSpan, stringAttribute } from './traceFixtures';
import {
  buildDisplaySpanTree,
  buildMessageAwareSpanTree,
  buildNavigationSpanTree,
  buildSpanTree,
  flattenSpanTree,
  type MessageTreeAnchor,
} from '../spanTree';

describe('span tree builders', () => {
  it('builds parent-child relationships and keeps orphaned spans as roots', () => {
    const spans = [
      createSpan('child', 'child', { parentId: 'root' }),
      createSpan('root', 'root'),
      createSpan('orphan', 'orphan', { parentId: 'missing' }),
    ];
    const tree = buildSpanTree(spans);

    expect(tree.map((node) => node.traceScopeSpanId)).toEqual(['root', 'orphan']);
    expect(tree[0]?.children.map((node) => node.traceScopeSpanId)).toEqual(['child']);
    expect(flattenSpanTree(tree).map((node) => node.traceScopeSpanId)).toEqual([
      'root',
      'child',
      'orphan',
    ]);
  });

  it('groups workflow and task spans into a chronological display tree', () => {
    const tree = buildDisplaySpanTree([
      createSpan('late-task', 'Task: second', { startTimeUnixNano: 30 }),
      createSpan('workflow', 'Workflow: run', { startTimeUnixNano: 10 }),
      createSpan('early-task', 'Task: first', { startTimeUnixNano: 20 }),
      createSpan('detail', 'HTTP request', { startTimeUnixNano: 25 }),
    ]);

    expect(tree.map((node) => node.name)).toEqual(['Workflow: run']);
    expect(tree[0]?.children.map((node) => node.name)).toEqual(['Task: second', 'Task: first']);
    expect(tree[0]?.children.find((node) => node.name === 'Task: first')?.children[0]?.name).toBe(
      'HTTP request'
    );
  });

  it('adds source-file nodes beneath retrieval spans', () => {
    const retrieval = createSpan('retrieval', 'document retrieval', {
      attributes: [
        stringAttribute(
          'rag.retrieval.evidence',
          JSON.stringify([{ id: 'chunk-1', source_file: 'docs/guide.md', content: 'Evidence' }])
        ),
      ],
    });
    const tree = buildNavigationSpanTree([retrieval]);

    expect(tree[0]?.children[0]).toMatchObject({
      displayName: 'docs/guide.md',
      sourceSpanId: 'retrieval',
      parentId: 'retrieval',
      children: [],
    });
  });

  it('replaces message spans with role nodes and attaches source nodes', () => {
    const spans = [
      createSpan('root', 'trace root'),
      createSpan('user-span', 'chat completion', {
        parentId: 'root',
        attributes: [
          stringAttribute(
            'gen_ai.input.messages',
            JSON.stringify([
              { role: 'system', content: 'Be concise.' },
              { role: 'user', content: 'Question' },
            ])
          ),
        ],
      }),
      createSpan('retrieval', 'document retrieval', {
        parentId: 'root',
        attributes: [
          stringAttribute('gen_ai.retrieval.query.text', 'Question'),
          stringAttribute(
            'rag.retrieval.evidence',
            JSON.stringify([{ id: 'chunk-1', source_file: 'docs/guide.md', content: 'Evidence' }])
          ),
        ],
      }),
    ];
    const anchors: MessageTreeAnchor[] = [
      {
        relatedTraceId: 'trace-1',
        relatedSpanId: 'user-span',
        role: 'system',
        content: 'Be concise.',
      },
      { relatedTraceId: 'trace-1', relatedSpanId: 'user-span', role: 'user', content: 'Question' },
      {
        relatedTraceId: 'trace-1',
        relatedSpanId: 'user-span',
        role: 'assistant',
        content: 'Answer',
      },
    ];

    const tree = buildMessageAwareSpanTree(spans, anchors);
    const messages = tree[0]?.children ?? [];

    expect(messages.map((node) => ('messageRole' in node ? node.messageRole : undefined))).toEqual([
      'system',
      'user',
      undefined,
    ]);
    expect(messages[0]?.displayName).toBe('Be concise.');
    expect(messages[1]?.children.map((node) => node.displayName)).toEqual([
      'docs/guide.md',
      'chat completion',
    ]);
    const assistantNode = messages[1]?.children[1];
    expect(
      assistantNode && 'messageRole' in assistantNode ? assistantNode.messageRole : undefined
    ).toBe('assistant');
  });

  it('hoists a shared system prompt above chat nodes under a workflow', () => {
    const spans = [
      createSpan('workflow', 'workflow'),
      createSpan('chat', 'chat completion', {
        parentId: 'workflow',
        attributes: [
          stringAttribute(
            'gen_ai.input.messages',
            JSON.stringify([
              { role: 'system', content: 'Shared prompt' },
              { role: 'user', content: 'Question' },
            ])
          ),
        ],
      }),
    ];
    const anchors: MessageTreeAnchor[] = [
      { relatedTraceId: 'trace-1', relatedSpanId: 'chat', role: 'user', content: 'Question' },
      { relatedTraceId: 'trace-1', relatedSpanId: 'chat', role: 'assistant', content: 'Answer' },
    ];

    const tree = buildMessageAwareSpanTree(spans, anchors);

    expect(
      tree[0]?.children.map((node) => ('messageRole' in node ? node.messageRole : undefined))
    ).toEqual(['system', 'user']);
    expect(tree[0]?.children[0]?.displayName).toBe('Shared prompt');
  });
});
