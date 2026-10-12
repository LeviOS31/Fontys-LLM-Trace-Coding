import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createProject, deleteProject, editProject } from '../../../../shared/api/projects';
import { QUERY_KEYS } from '../../../../shared/api/queryKeys';
import type { Project } from '../../../../shared/types/project';
import type { Projects } from '../../../../shared/types/projects';
import { useCreateProject } from '../useCreateProject';
import { useDeleteProject } from '../useDeleteProject';
import { useEditProject } from '../useEditProject';

vi.mock('../../../../shared/api/projects.ts', () => ({
  createProject: vi.fn(),
  deleteProject: vi.fn(),
  editProject: vi.fn(),
}));

const project: Project = {
  projectId: 'project-1',
  userId: 'user-1',
  name: 'Study',
  description: 'Description',
  versions: [],
  assessmentCriteria: [],
};

describe('Project mutation hooks', () => {
  beforeEach(() => {
    vi.mocked(createProject).mockReset();
    vi.mocked(deleteProject).mockReset();
    vi.mocked(editProject).mockReset();
  });

  it('creates a project and adds it to the project-list cache', async () => {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    vi.mocked(createProject).mockResolvedValue(project);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useCreateProject(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ name: 'Study', description: 'Description' });
    });

    expect(createProject).toHaveBeenCalledWith({ name: 'Study', description: 'Description' });
    expect(client.getQueryData<Projects>(QUERY_KEYS.projects.all)).toEqual({
      projects: [project],
    });
  });

  it('edits the project and updates list and detail caches', async () => {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const updated = { ...project, name: 'Updated study' };
    client.setQueryData<Projects>(QUERY_KEYS.projects.all, { projects: [project] });
    vi.mocked(editProject).mockResolvedValue(updated);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useEditProject(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        projectId: 'project-1',
        name: 'Updated study',
        description: 'Description',
      });
    });

    expect(editProject).toHaveBeenCalledWith({
      projectId: 'project-1',
      name: 'Updated study',
      description: 'Description',
    });
    expect(client.getQueryData<Projects>(QUERY_KEYS.projects.all)?.projects[0]).toEqual(updated);
    expect(client.getQueryData(QUERY_KEYS.projects.detail('project-1'))).toEqual(updated);
  });

  it('deletes a project from the cache and invalidates the project list', async () => {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    client.setQueryData<Projects>(QUERY_KEYS.projects.all, { projects: [project] });
    const invalidate = vi.spyOn(client, 'invalidateQueries').mockResolvedValue(undefined);
    vi.mocked(deleteProject).mockResolvedValue(undefined);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useDeleteProject(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('project-1');
    });

    expect(deleteProject).toHaveBeenCalledWith('project-1');
    expect(client.getQueryData<Projects>(QUERY_KEYS.projects.all)).toEqual({ projects: [] });
    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({ queryKey: QUERY_KEYS.projects.all })
    );
  });
});