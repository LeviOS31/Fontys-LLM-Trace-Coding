import '@testing-library/jest-dom/vitest';
import { Theme } from '@radix-ui/themes';
import { cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import JudgeTraceDialog from '../JudgeTraceDialog';

vi.mock('../../../opencode/traceGroup/LLM/LlmContent', () => ({
  LlmContent: ({ llmMessages }: { llmMessages: Array<{ content: string }> }) => (
    <div data-testid="llm-content">{llmMessages.map((message) => message.content).join(' ')}</div>
  ),
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const traceContent = {
  traceId: 'trace-1',
  traceScopes: [
    {
      name: 'test-scope',
      version: '1.0',
      spans: [
        {
          traceScopeSpanId: 'span-1',
          spanKind: 'Internal',
          parentId: null,
          name: 'llm',
          startTimeUnixNano: 1,
          endTimeUnixNano: 2,
          attributes: [
            {
              key: 'gen_ai.input.messages',
              value: JSON.stringify([{ role: 'user', parts: [{ type: 'text', content: 'Trace prompt' }] }]),
              traceAttributeType: 'String',
            },
          ],
          events: [],
        },
      ],
    },
  ],
};

describe('JudgeTraceDialog', () => {
  it('loads the selected trace and renders it with the existing LLM content view', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => traceContent,
    });
    vi.stubGlobal('fetch', fetchMock);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <Theme>
          <JudgeTraceDialog
            projectId="project-1"
            versionId="version-1"
            traceId="trace-1"
            onClose={vi.fn()}
          />
        </Theme>
      </QueryClientProvider>
    );

    expect(await screen.findByText('Trace prompt')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/v1/projects/project-1/versions/version-1/traces/trace-1'),
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });
});