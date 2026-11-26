import '@testing-library/jest-dom/vitest';
import { Theme } from '@radix-ui/themes';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getTrace } from '../../../../shared/api/traces';
import type { JudgeResult } from '../../hooks/judgeUtils';
import JudgeEvaluation from '../JudgeEvalutation';

vi.mock('../../../../shared/api/traces', () => ({ getTrace: vi.fn() }));
vi.mock('../../../../shared/api/rawllmoutput', () => ({ getRawLLMOutputById: vi.fn() }));
vi.mock('../../../opencode/traceGroup/LLM/traceMessages', () => ({
  getLlmMessages: vi.fn(() => []),
}));
vi.mock('../../../opencode/traceGroup/LLM/LlmContent', () => ({
  LlmContent: ({ selectedTraceId }: { selectedTraceId: string }) => (
    <div data-testid="loaded-trace">{selectedTraceId}</div>
  ),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const results: JudgeResult[] = [
  {
    traceId: 'trace-1',
    status: 'success',
    verdict: 'true',
    reasoning: null,
    error: null,
    judgingTrace: true,
  },
  {
    traceId: 'trace-2',
    status: 'success',
    verdict: 'false',
    reasoning: null,
    error: null,
    judgingTrace: true,
  },
];

describe('JudgeEvaluation', () => {
  it('loads the first result and advances to the next trace in results order', async () => {
    vi.mocked(getTrace).mockImplementation(async (_projectId, _versionId, traceId) => ({
      traceId,
      traceScopes: [],
    }));
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <Theme>
          <JudgeEvaluation
            projectId="project-1"
            versionId="version-1"
            results={results}
            onClose={vi.fn()}
          />
        </Theme>
      </QueryClientProvider>
    );

    expect(await screen.findByTestId('loaded-trace')).toHaveTextContent('trace-1');
    fireEvent.click(screen.getByRole('button', { name: 'Next trace' }));
    expect(await screen.findByTestId('loaded-trace')).toHaveTextContent('trace-2');
    expect(vi.mocked(getTrace).mock.calls.map((call) => call[2])).toEqual(['trace-1', 'trace-2']);
    expect(screen.getByRole('button', { name: 'Next trace' })).toBeDisabled();
  });
});
