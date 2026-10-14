import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getDefaultLlmConfig, getLlmStatus } from '../../../../shared/api/settings';
import { QUERY_KEYS } from '../../../../shared/api/queryKeys';
import type { LlmStatus } from '../../../../shared/types/settings';
import { useGetDefaultLlmConfig } from '../useGetDefaultLlmConfig';
import { useGetLlmStatus } from '../useGetLlmStatus';

vi.mock('../../../../shared/api/settings.ts', () => ({
  getDefaultLlmConfig: vi.fn(),
  getLlmStatus: vi.fn(),
}));

describe('Settings query hooks', () => {
  beforeEach(() => {
    vi.mocked(getDefaultLlmConfig).mockReset();
    vi.mocked(getLlmStatus).mockReset();
  });

  it('fetches and caches the current LLM status', async () => {
    const client = new QueryClient();
    const status: LlmStatus = {
      providerName: 'Test provider',
      endpoint: 'https://api.example.com',
      modelName: 'test-model',
      isConnected: true,
    };
    vi.mocked(getLlmStatus).mockResolvedValue(status);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useGetLlmStatus(), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual(status));
    expect(getLlmStatus).toHaveBeenCalledOnce();
    expect(client.getQueryData(QUERY_KEYS.settings.llmStatus)).toEqual(status);
  });

  it('fetches and caches the default LLM configuration', async () => {
    const client = new QueryClient();
    const config: LlmStatus = {
      providerName: 'Default provider',
      endpoint: 'https://default.example.com',
      modelName: 'default-model',
    };
    vi.mocked(getDefaultLlmConfig).mockResolvedValue(config);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useGetDefaultLlmConfig(), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual(config));
    expect(getDefaultLlmConfig).toHaveBeenCalledOnce();
    expect(client.getQueryData(QUERY_KEYS.settings.llmDefaultConfig)).toEqual(config);
  });
});