import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getCurrentAxialCodesOfVersion } from '../../../../shared/api/axialCode';
import { useGetCurrentAxialCodesOfVersion } from '../useGetCurrentAxialCodesOfVersion';

vi.mock('../../../../shared/api/axialCode.ts', () => ({
  getCurrentAxialCodesOfVersion: vi.fn(),
}));

describe('useGetCurrentAxialCodesOfVersion', () => {
  beforeEach(() => vi.mocked(getCurrentAxialCodesOfVersion).mockReset());

  it('fetches saved codes for a project version', async () => {
    const response = { axialCodes: [], createdAt: '2026-10-12T10:00:00.000Z' };
    vi.mocked(getCurrentAxialCodesOfVersion).mockResolvedValue(response);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(
      () => useGetCurrentAxialCodesOfVersion('project-1', 'version-1'),
      { wrapper }
    );

    await waitFor(() => expect(result.current.data).toEqual(response));
    expect(getCurrentAxialCodesOfVersion).toHaveBeenCalledWith('project-1', 'version-1');
  });

  it('does not fetch when disabled', () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(
      () => useGetCurrentAxialCodesOfVersion('project-1', 'version-1', false),
      { wrapper }
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(getCurrentAxialCodesOfVersion).not.toHaveBeenCalled();
  });
});
