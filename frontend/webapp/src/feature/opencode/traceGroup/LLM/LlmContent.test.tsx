import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LlmContent } from './LlmContent';
import type { LlmMessage } from '../TraceGroupPage';

vi.mock('react-syntax-highlighter', () => ({
  Prism: ({ children }: { children: ReactNode }) => createElement('pre', null, children),
}));

afterEach(cleanup);

const message = (content: string, overrides: Partial<LlmMessage> = {}): LlmMessage => ({
  role: 'assistant',
  content,
  index: 0,
  relatedTraceId: 'trace-1',
  relatedSpanId: 'span-1',
  modelName: 'test-model',
  amountOfSpans: 1,
  ...overrides,
});

function renderMessages(messages: LlmMessage[]) {
  return render(
    <LlmContent
      llmMessages={messages}
      selectedTraceId={null}
      selectedSpanId={null}
      selectedMessageRole={null}
      selectedSourceFile={null}
      setSelectedTrace={() => undefined}
      scrollRequest={0}
      onScrollChange={() => undefined}
    />
  );
}

describe('LLM chat content', () => {
  it('renders markdown text and model metadata', () => {
    renderMessages([message('**A concise summary** based on the source.')]);

    expect(screen.getByRole('heading', { name: 'LLM chat interaction' })).toBeInTheDocument();
    expect(screen.getByText('A concise summary')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'TEST-MODEL' })).toBeInTheDocument();
  });

  it('renders fenced code without using an async ReactMarkdown component', async () => {
    renderMessages([message('```json\n{"ok":true}\n```')]);

    expect(await screen.findByText('json')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/"ok":\s*true/)).toBeInTheDocument());
  });

  it('shows retrieved chunks in a dialog and dismisses it with Escape', async () => {
    renderMessages([
      message('Summarize this source', {
        role: 'user',
        retrievedSources: [
          {
            sourceFile: 'docs/guide.md',
            retrievalSpanIds: ['retrieval-1'],
            chunks: [
              {
                id: 'chunk-1',
                content: 'Retrieved evidence text',
                usedForGeneration: true,
                score: 0.91,
              },
            ],
          },
        ],
      }),
    ]);

    fireEvent.click(screen.getByRole('button', { name: /docs\/guide\.md/ }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Retrieved source content')).toBeInTheDocument();
    expect(screen.getByText('Retrieved evidence text')).toBeInTheDocument();
    expect(screen.getByText('Used for generation')).toBeInTheDocument();
    expect(screen.getByText('Score: 0.910')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('renders an empty conversation without message content', () => {
    renderMessages([]);

    expect(screen.getByRole('heading', { name: 'LLM chat interaction' })).toBeInTheDocument();
    expect(screen.queryByText('ASSISTANT')).not.toBeInTheDocument();
  });
});
