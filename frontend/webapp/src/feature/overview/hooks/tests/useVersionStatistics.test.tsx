import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getProjectVersionStatistics } from '../../../../shared/api/statistics';
import { QUERY_KEYS } from '../../../../shared/api/queryKeys';
import type { ProjectVersionStatistics } from '../../../../shared/types/statistics.dto';
import { useVersionStatistics } from '../useVersionStatistics';

vi.mock('../../../../shared/api/statistics.ts', () => ({
  getProjectVersionStatistics: vi.fn(),
}));

describe('useVersionStatistics', () => {
  beforeEach(() => vi.mocked(getProjectVersionStatistics).mockReset());

  it('fetches and caches statistics for the selected project version', async () => {
    const client = new QueryClient();
    const statistics: ProjectVersionStatistics = {
      versionTraceCount: 3,
      versionOpenCodeCount: 5,
      versionAxialCodeCount: 1,
      versionAxialCodes: [],
    };
    vi.mocked(getProjectVersionStatistics).mockResolvedValue(statistics);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useVersionStatistics('project-1', 'version-1'), {
      wrapper,
    });

    await waitFor(() => expect(result.current.data).toEqual(statistics));
    expect(getProjectVersionStatistics).toHaveBeenCalledWith('project-1', 'version-1');
    expect(
      client.getQueryData(QUERY_KEYS.statistics.version('project-1', 'version-1'))
    ).toEqual(statistics);
  });
});
