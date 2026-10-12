import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createVersion } from '../../../../shared/api/versions';
import { QUERY_KEYS } from '../../../../shared/api/queryKeys';
import type { Project } from '../../../../shared/types/project';
import type { Version } from '../../../../shared/types/version';
import { useCreateVersion } from '../useCreateVersion';

vi.mock('../../../../shared/api/versions.ts', () => ({ createVersion: vi.fn() }));

describe('useCreateVersion', () => {
  beforeEach(() => vi.mocked(createVersion).mockReset());

  it('creates a version and appends it to the cached project', async () => {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const project: Project = {
      projectId: 'project-1',
      userId: 'user-1',
      name: 'Research',
      description: '',
      versions: [],
      assessmentCriteria: [],
    };
    client.setQueryData(QUERY_KEYS.projects.detail('project-1'), project);
    const version: Version = {
      projectId: 'project-1',
      versionId: 'version-1',
      name: 'First',
      description: 'Initial analysis',
    };
    vi.mocked(createVersion).mockResolvedValue(version);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useCreateVersion(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        projectId: 'project-1',
        name: 'First',
        description: 'Initial analysis',
      });
    });

    expect(createVersion).toHaveBeenCalledWith({
      projectId: 'project-1',
      name: 'First',
      description: 'Initial analysis',
    });
    expect(client.getQueryData<Project>(QUERY_KEYS.projects.detail('project-1'))?.versions).toEqual([
      version,
    ]);
  });

  it('initializes a project cache with the created version when no prior project exists', async () => {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const version: Version = {
      projectId: 'project-1',
      versionId: 'version-1',
      name: 'First',
      description: 'Initial analysis',
    };
    vi.mocked(createVersion).mockResolvedValue(version);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useCreateVersion(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        projectId: 'project-1',
        name: 'First',
        description: 'Initial analysis',
      });
    });

    expect(client.getQueryData<Project>(QUERY_KEYS.projects.detail('project-1'))?.versions).toEqual([
      version,
    ]);
  });
});