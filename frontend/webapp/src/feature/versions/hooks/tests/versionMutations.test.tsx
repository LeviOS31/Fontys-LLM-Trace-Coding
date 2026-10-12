import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteVersion, editVersion } from '../../../../shared/api/versions';
import { QUERY_KEYS } from '../../../../shared/api/queryKeys';
import type { Project } from '../../../../shared/types/project';
import type { Version } from '../../../../shared/types/version';
import { useDeleteVersion } from '../useDeleteVersion';
import { useEditVersion } from '../useEditVersion';

vi.mock('../../../../shared/api/versions.ts', () => ({
  deleteVersion: vi.fn(),
  editVersion: vi.fn(),
}));

const firstVersion: Version = {
  projectId: 'project-1',
  versionId: 'version-1',
  name: 'First',
  description: 'First version',
};
const secondVersion: Version = {
  projectId: 'project-1',
  versionId: 'version-2',
  name: 'Second',
  description: 'Second version',
};

function createProject(): Project {
  return {
    projectId: 'project-1',
    userId: 'user-1',
    name: 'Research',
    description: '',
    versions: [firstVersion, secondVersion],
    assessmentCriteria: [],
  };
}

describe('Version mutation hooks', () => {
  beforeEach(() => {
    vi.mocked(deleteVersion).mockReset();
    vi.mocked(editVersion).mockReset();
  });

  it('updates a version in the project cache after a successful edit', async () => {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    client.setQueryData(QUERY_KEYS.projects.detail('project-1'), createProject());
    const updatedVersion = { ...firstVersion, name: 'Updated first', description: 'Updated' };
    vi.mocked(editVersion).mockResolvedValue(updatedVersion);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useEditVersion(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        projectId: 'project-1',
        versionId: 'version-1',
        name: 'Updated first',
        description: 'Updated',
      });
    });

    expect(editVersion).toHaveBeenCalledWith({
      projectId: 'project-1',
      versionId: 'version-1',
      name: 'Updated first',
      description: 'Updated',
    });
    expect(client.getQueryData<Project>(QUERY_KEYS.projects.detail('project-1'))?.versions).toEqual([
      updatedVersion,
      secondVersion,
    ]);
  });

  it('deletes a version from the project cache and invalidates project details', async () => {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    client.setQueryData(QUERY_KEYS.projects.detail('project-1'), createProject());
    const invalidate = vi.spyOn(client, 'invalidateQueries').mockResolvedValue(undefined);
    vi.mocked(deleteVersion).mockResolvedValue(undefined);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useDeleteVersion(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ projectId: 'project-1', versionId: 'version-1' });
    });

    expect(deleteVersion).toHaveBeenCalledWith('project-1', 'version-1');
    expect(client.getQueryData<Project>(QUERY_KEYS.projects.detail('project-1'))?.versions).toEqual([
      secondVersion,
    ]);
    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: QUERY_KEYS.projects.detail('project-1'),
      })
    );
  });
});