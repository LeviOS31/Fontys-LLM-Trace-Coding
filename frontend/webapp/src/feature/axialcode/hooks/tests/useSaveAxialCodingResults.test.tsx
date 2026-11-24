import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { saveAxialCodingResults } from '../../../../shared/api/axialCode';
import { QUERY_KEYS } from '../../../../shared/api/queryKeys';
import { useSaveAxialCodingResults } from '../useSaveAxialCodingResults';

vi.mock('../../../../shared/api/axialCode.ts', () => ({
  saveAxialCodingResults: vi.fn(),
}));

function setup() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}

describe('useSaveAxialCodingResults', () => {
  beforeEach(() => vi.mocked(saveAxialCodingResults).mockReset());

  it('saves the result and invalidates the current axial-code query', async () => {
    const { client, wrapper } = setup();
    vi.mocked(saveAxialCodingResults).mockResolvedValue(undefined);
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useSaveAxialCodingResults('project-1', 'version-1'), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync('result-1');
    });

    expect(saveAxialCodingResults).toHaveBeenCalledWith('project-1', 'version-1', 'result-1');
    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: QUERY_KEYS.axialCoding.currentAxialCodesOfVersion('version-1'),
      })
    );
  });

  it('rejects saving when saving is disabled', async () => {
    const { wrapper } = setup();
    const { result } = renderHook(
      () => useSaveAxialCodingResults('project-1', 'version-1', false),
      { wrapper }
    );

    await act(async () => {
      await expect(result.current.mutateAsync('result-1')).rejects.toThrow(
        'Axial code saving is disabled.'
      );
    });
    expect(saveAxialCodingResults).not.toHaveBeenCalled();
  });
});
