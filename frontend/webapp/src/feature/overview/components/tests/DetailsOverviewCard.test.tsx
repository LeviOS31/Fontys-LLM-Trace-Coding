import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Project } from '../../../../shared/types/project';
import DetailsOverviewCard from '../DetailsOverviewCard';

const { useGetProject } = vi.hoisted(() => ({ useGetProject: vi.fn() }));
vi.mock('../../../projects/hooks/useGetProject.ts', () => ({ useGetProject }));

const project: Project = {
  projectId: 'project-1',
  userId: 'user-1',
  name: 'Research project',
  description: '',
  assessmentCriteria: [],
  versions: [
    {
      versionId: 'version-1',
      projectId: 'project-1',
      name: 'Initial analysis',
      description: 'First interview batch',
    },
  ],
};

describe('DetailsOverviewCard', () => {
  it('shows the selected version details', () => {
    useGetProject.mockReturnValue({ data: project, isLoading: false });
    render(<DetailsOverviewCard projectId="project-1" projectVersionId="version-1" />);

    expect(screen.getByText('Version Details')).toBeInTheDocument();
    expect(screen.getByText('Initial analysis')).toBeInTheDocument();
    expect(screen.getByText('First interview batch')).toBeInTheDocument();
  });

  it('shows fallbacks when the selected version is absent', () => {
    useGetProject.mockReturnValue({ data: project, isLoading: false });
    render(<DetailsOverviewCard projectId="project-1" projectVersionId="missing" />);

    expect(screen.getByText('No version')).toBeInTheDocument();
    expect(screen.getByText('No description')).toBeInTheDocument();
  });
});
