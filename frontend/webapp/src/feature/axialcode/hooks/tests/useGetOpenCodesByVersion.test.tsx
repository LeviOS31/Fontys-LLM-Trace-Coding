import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getOpenCodesByVersion } from '../../../../shared/api/openCode';
import { useGetOpenCodesByVersion } from '../useGetOpenCodesByVersion';

vi.mock('../../../../shared/api/openCode.ts', () => ({
  getOpenCodesByVersion: vi.fn(),
}));

describe('useGetOpenCodesByVersion', () => {
  beforeEach(() => vi.mocked(getOpenCodesByVersion).mockReset());

  it('fetches open codes for the requested project version', async () => {
    const openCodes = [{ traceId: 'trace-1', openCode: 'A useful observation' }];
    vi.mocked(getOpenCodesByVersion).mockResolvedValue(openCodes);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useGetOpenCodesByVersion('project-1', 'version-1'), {
      wrapper,
    });

    await waitFor(() => expect(result.current.data).toEqual(openCodes));
    expect(getOpenCodesByVersion).toHaveBeenCalledWith('project-1', 'version-1');
  });
});
