import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Project } from '../../../../shared/types/project';
import ProjectDetailsCard from '../ProjectDetailsCard';

const { useGetProject } = vi.hoisted(() => ({ useGetProject: vi.fn() }));
vi.mock('../../hooks/useGetProject.ts', () => ({ useGetProject }));

const project: Project = {
  projectId: 'project-1',
  userId: 'user-1',
  name: 'Research project',
  description: 'Evaluating interviews',
  versions: [],
  assessmentCriteria: [],
};

describe('ProjectDetailsCard', () => {
  it('shows project name and description', () => {
    useGetProject.mockReturnValue({ data: project, isLoading: false });
    render(<ProjectDetailsCard projectId="project-1" />);

    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByText('Research project')).toBeInTheDocument();
    expect(screen.getByText('Evaluating interviews')).toBeInTheDocument();
  });

  it('shows fallback text when project details are missing', () => {
    useGetProject.mockReturnValue({ data: undefined, isLoading: false });
    render(<ProjectDetailsCard projectId="missing" />);

    expect(screen.getByText('Unnamed project')).toBeInTheDocument();
    expect(screen.getByText('No description')).toBeInTheDocument();
  });
});