import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateAxialCodingResults } from '../../../../shared/api/axialCode';
import { QUERY_KEYS } from '../../../../shared/api/queryKeys';
import { useGenerateAxialCodingResults } from '../useGenerateAxialCodingResult';

vi.mock('../../../../shared/api/axialCode.ts', () => ({
  generateAxialCodingResults: vi.fn(),
}));

function setup() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}

describe('useGenerateAxialCodingResults', () => {
  beforeEach(() => vi.mocked(generateAxialCodingResults).mockReset());

  it('generates codes and rechecks LLM status when connection status is unknown', async () => {
    const { client, wrapper } = setup();
    client.setQueryData(QUERY_KEYS.settings.llmStatus, { isConnected: undefined });
    vi.mocked(generateAxialCodingResults).mockResolvedValue({
      axialCodingResultId: 'result-1',
      axialCodes: [],
    });
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useGenerateAxialCodingResults('project-1', 'version-1'), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({ feedback: null, axialCodes: null });
    });

    expect(generateAxialCodingResults).toHaveBeenCalledWith('project-1', 'version-1', {
      feedback: null,
      axialCodes: null,
    });
    expect(client.getQueryData(QUERY_KEYS.settings.llmStatus)).toEqual({ isConnected: undefined });
    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: QUERY_KEYS.settings.llmStatus,
      })
    );
  });

  it('does not recheck LLM status after success when already connected', async () => {
    const { client, wrapper } = setup();
    client.setQueryData(QUERY_KEYS.settings.llmStatus, { isConnected: true });
    vi.mocked(generateAxialCodingResults).mockResolvedValue({
      axialCodingResultId: 'result-1',
      axialCodes: [],
    });
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useGenerateAxialCodingResults('project-1', 'version-1'), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({ feedback: null, axialCodes: null });
    });

    expect(invalidate).not.toHaveBeenCalled();
  });

});
