import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setLlmConfig } from '../../../../shared/api/settings';
import { QUERY_KEYS } from '../../../../shared/api/queryKeys';
import type { LlmConfig } from '../../../../shared/types/settings';
import { useSetLlmConfig } from '../useSetLlmConfig';

vi.mock('../../../../shared/api/settings.ts', () => ({
  setLlmConfig: vi.fn(),
}));

describe('useSetLlmConfig', () => {
  beforeEach(() => vi.mocked(setLlmConfig).mockReset());

  it('sends configuration, updates status cache, and invalidates it', async () => {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const invalidate = vi.spyOn(client, 'invalidateQueries').mockResolvedValue(undefined);
    const config: LlmConfig = {
      providerName: 'Test provider',
      endpoint: 'https://api.example.com',
      modelName: 'test-model',
    };
    vi.mocked(setLlmConfig).mockResolvedValue(config);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useSetLlmConfig(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(config);
    });

    expect(setLlmConfig).toHaveBeenCalledWith(config);
    expect(client.getQueryData(QUERY_KEYS.settings.llmStatus)).toEqual({
      providerName: 'Test provider',
      endpoint: 'https://api.example.com',
      modelName: 'test-model',
      isConnected: undefined,
    });
    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({ queryKey: QUERY_KEYS.settings.llmStatus })
    );
  });

  it('handles clearing all optional values when updating the cached status', async () => {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    vi.mocked(setLlmConfig).mockResolvedValue({
      providerName: null,
      endpoint: null,
      modelName: null,
    });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useSetLlmConfig(), { wrapper });
    const cleared = { providerName: null, endpoint: null, modelName: null };

    await act(async () => {
      await result.current.mutateAsync(cleared);
    });

    expect(client.getQueryData(QUERY_KEYS.settings.llmStatus)).toEqual({
      providerName: undefined,
      endpoint: undefined,
      modelName: undefined,
      isConnected: undefined,
    });
  });
});