import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import ProjectPage from '../../ProjectPage';

const { useGetProject } = vi.hoisted(() => ({ useGetProject: vi.fn() }));
vi.mock('../../hooks/useGetProject.ts', () => ({ useGetProject }));
vi.mock('../ProjectDetailsCard.tsx', () => ({ default: () => <div>Project details</div> }));
vi.mock('../ProjectAnalyticsCard/ProjectAnalyticsCard.tsx', () => ({
  default: () => <div>Project analytics</div>,
}));

describe('ProjectPage', () => {
  it('renders project analytics when the project is loaded', () => {
    useGetProject.mockReturnValue({ data: { projectId: 'project-1' }, isLoading: false });
    render(
      <MemoryRouter initialEntries={['/projects/project-1']}>
        <Routes>
          <Route path="/projects/:id" element={<ProjectPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Project Analytics')).toBeInTheDocument();
    expect(screen.getByText('Project details')).toBeInTheDocument();
    expect(screen.getByText('Project analytics')).toBeInTheDocument();
  });

  it('shows a loading view before project data arrives', () => {
    useGetProject.mockReturnValue({ data: undefined, isLoading: true });
    render(
      <MemoryRouter initialEntries={['/projects/project-1']}>
        <Routes>
          <Route path="/projects/:id" element={<ProjectPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Project Analytics')).toBeInTheDocument();
  });

  it('renders a project fetch error', () => {
    useGetProject.mockReturnValue({ data: undefined, isLoading: false, error: new Error() });
    render(
      <MemoryRouter initialEntries={['/projects/project-1']}>
        <Routes>
          <Route path="/projects/:id" element={<ProjectPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('Failed to load project.')).toBeInTheDocument();
  });

  it('redirects to not found when the project id is missing or not found', () => {
    useGetProject.mockReturnValue({ data: undefined, isLoading: false, error: null });
    render(
      <MemoryRouter initialEntries={['/projects']}>
        <Routes>
          <Route path="/projects/:id?" element={<ProjectPage />} />
          <Route path="/404" element={<div>Not found</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('Not found')).toBeInTheDocument();
  });
});
