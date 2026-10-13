import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAllProjects, getProject } from '../../../../shared/api/projects';
import { QUERY_KEYS } from '../../../../shared/api/queryKeys';
import { useGetAllProjects } from '../useGetAllProjects';
import { useGetProject } from '../useGetProject';

vi.mock('../../../../shared/api/projects.ts', () => ({
  getAllProjects: vi.fn(),
  getProject: vi.fn(),
}));

describe('Project query hooks', () => {
  beforeEach(() => {
    vi.mocked(getAllProjects).mockReset();
    vi.mocked(getProject).mockReset();
  });

  it('fetches and caches the project list', async () => {
    const client = new QueryClient();
    const projects = { projects: [] };
    vi.mocked(getAllProjects).mockResolvedValue(projects);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useGetAllProjects(), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual(projects));
    expect(getAllProjects).toHaveBeenCalledOnce();
    expect(client.getQueryData(QUERY_KEYS.projects.all)).toEqual(projects);
  });

  it('fetches a project by id and disables the query without an id', async () => {
    const client = new QueryClient();
    const project = {
      projectId: 'project-1',
      userId: 'user-1',
      name: 'Study',
      description: '',
      versions: [],
      assessmentCriteria: [],
    };
    vi.mocked(getProject).mockResolvedValue(project);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result, rerender } = renderHook(
      ({ id }: { id: string | undefined }) => useGetProject(id),
      {
        initialProps: { id: undefined as string | undefined },
        wrapper,
      }
    );

    expect(getProject).not.toHaveBeenCalled();
    rerender({ id: 'project-1' });
    await waitFor(() => expect(result.current.data).toEqual(project));
    expect(getProject).toHaveBeenCalledWith('project-1');
    expect(client.getQueryData(QUERY_KEYS.projects.detail('project-1'))).toEqual(project);
  });
});