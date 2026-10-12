import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getTraceCollections } from '../../../../shared/api/traces';
import { useGetTraceCollections } from '../useGetTraceCollections';

vi.mock('../../../../shared/api/traces', () => ({ getTraceCollections: vi.fn() }));

function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return {
    client,
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  };
}

describe('useGetTraceCollections', () => {
  beforeEach(() => vi.mocked(getTraceCollections).mockReset());

  it('fetches collections for a complete project and version', async () => {
    const collections = [{ traceCollectionId: 'collection-1', name: 'Batch A' }];
    vi.mocked(getTraceCollections).mockResolvedValue(collections as never);
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useGetTraceCollections('project-1', 'version-1'), {
      wrapper,
    });

    await waitFor(() => expect(result.current.data).toEqual(collections));
    expect(getTraceCollections).toHaveBeenCalledWith('project-1', 'version-1');
  });

  it('does not fetch collections until both identifiers are available', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useGetTraceCollections(undefined, 'version-1'), {
      wrapper,
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(getTraceCollections).not.toHaveBeenCalled();
  });
});
