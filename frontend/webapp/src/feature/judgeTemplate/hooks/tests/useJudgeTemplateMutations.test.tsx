import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createJudgeTemplate,
  deleteJudgeTemplate,
  deleteJudgeTemplateVersion,
  restoreJudgeTemplateVersion,
  updateJudgeTemplate,
} from '../../../../shared/api/judgeTemplates';
import { QUERY_KEYS } from '../../../../shared/api/queryKeys';
import { useCreateJudgeTemplate } from '../useCreateJudgeTemplate';
import { useDeleteJudgeTemplate } from '../useDeleteJudgeTemplate';
import { useDeleteJudgeTemplateVersion } from '../useDeleteJudgeTemplateVersion';
import { useRestoreJudgeTemplateVersion } from '../useRestoreJudgeTemplateVersion';
import { useUpdateJudgeTemplate } from '../useUpdateJudgeTemplate';

vi.mock('../../../../shared/api/judgeTemplates.ts', () => ({
  createJudgeTemplate: vi.fn(),
  deleteJudgeTemplate: vi.fn(),
  deleteJudgeTemplateVersion: vi.fn(),
  restoreJudgeTemplateVersion: vi.fn(),
  updateJudgeTemplate: vi.fn(),
}));

describe('Judge Template mutation hooks', () => {
  beforeEach(() => {
    vi.mocked(createJudgeTemplate).mockReset();
    vi.mocked(deleteJudgeTemplate).mockReset();
    vi.mocked(deleteJudgeTemplateVersion).mockReset();
    vi.mocked(restoreJudgeTemplateVersion).mockReset();
    vi.mocked(updateJudgeTemplate).mockReset();
  });

  it('creates a template and invalidates the version list', async () => {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const invalidate = vi.spyOn(client, 'invalidateQueries').mockResolvedValue(undefined);
    vi.mocked(createJudgeTemplate).mockResolvedValue({ judgeTemplateId: 'template-1' });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useCreateJudgeTemplate('project-1', 'version-1'), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        axialCodeId: 'axial-1',
        name: 'Communication judge',
        description: 'Reviews communication',
      });
    });

    expect(createJudgeTemplate).toHaveBeenCalledWith('project-1', 'version-1', 'axial-1', {
      name: 'Communication judge',
      description: 'Reviews communication',
    });
    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: QUERY_KEYS.judgeTemplates.byVersion('version-1'),
      })
    );
  });

  it('deletes a template and invalidates the version list', async () => {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const invalidate = vi.spyOn(client, 'invalidateQueries').mockResolvedValue(undefined);
    vi.mocked(deleteJudgeTemplate).mockResolvedValue(undefined);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useDeleteJudgeTemplate('project-1', 'version-1'), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync('template-1');
    });

    expect(deleteJudgeTemplate).toHaveBeenCalledWith('project-1', 'version-1', 'template-1');
    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: QUERY_KEYS.judgeTemplates.byVersion('version-1'),
      })
    );
  });

  it('updates template instructions and invalidates the version list', async () => {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const invalidate = vi.spyOn(client, 'invalidateQueries').mockResolvedValue(undefined);
    vi.mocked(updateJudgeTemplate).mockResolvedValue(undefined);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useUpdateJudgeTemplate('project-1', 'version-1'), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        judgeTemplateId: 'template-1',
        content: 'Updated judge instructions',
      });
    });

    expect(updateJudgeTemplate).toHaveBeenCalledWith('project-1', 'version-1', 'template-1', {
      content: 'Updated judge instructions',
    });
    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: QUERY_KEYS.judgeTemplates.byVersion('version-1'),
      })
    );
  });

  it('restores a history version and invalidates templates and version history', async () => {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const invalidate = vi.spyOn(client, 'invalidateQueries').mockResolvedValue(undefined);
    vi.mocked(restoreJudgeTemplateVersion).mockResolvedValue(undefined);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(
      () => useRestoreJudgeTemplateVersion('project-1', 'version-1'),
      { wrapper }
    );

    await act(async () => {
      await result.current.mutateAsync({
        judgeTemplateId: 'template-1',
        versionNumber: 3,
      });
    });

    expect(restoreJudgeTemplateVersion).toHaveBeenCalledWith(
      'project-1',
      'version-1',
      'template-1',
      3
    );
    await waitFor(() => {
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: QUERY_KEYS.judgeTemplates.byVersion('version-1'),
      });
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: ['judgeTemplateVersions', 'version-1', 'template-1'],
      });
    });
  });

  it('deletes a history version and invalidates that template history', async () => {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const invalidate = vi.spyOn(client, 'invalidateQueries').mockResolvedValue(undefined);
    vi.mocked(deleteJudgeTemplateVersion).mockResolvedValue(undefined);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(
      () => useDeleteJudgeTemplateVersion('project-1', 'version-1'),
      { wrapper }
    );

    await act(async () => {
      await result.current.mutateAsync({
        judgeTemplateId: 'template-1',
        versionNumber: 2,
      });
    });

    expect(deleteJudgeTemplateVersion).toHaveBeenCalledWith(
      'project-1',
      'version-1',
      'template-1',
      2
    );
    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: ['judgeTemplateVersions', 'version-1', 'template-1'],
      })
    );
  });
});
