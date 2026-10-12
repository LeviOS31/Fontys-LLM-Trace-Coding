import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { AssessmentCriterion as Criterion } from '../../../../shared/types/assessmentCriterion';
import { AssessmentCriteriaContainer } from '../AssessmentCriteriaContainer';

const { useGetProject } = vi.hoisted(() => ({ useGetProject: vi.fn() }));

vi.mock('../../../projects/hooks/useGetProject', () => ({ useGetProject }));
vi.mock('../AssessmentCriterion.tsx', () => ({
  AssessmentCriterion: ({ criterion }: { criterion: Criterion }) => (
    <div data-testid="criterion">{criterion.criterion}</div>
  ),
}));
vi.mock('../CreateAssessmentCriterion.tsx', () => ({
  CreateAssessmentCriterion: ({ projectId }: { projectId: string }) => (
    <div data-testid="create-criterion">{projectId}</div>
  ),
}));

describe('AssessmentCriteriaContainer', () => {
  it('renders an error state when the project fails to load', () => {
    useGetProject.mockReturnValue({ isError: true, isLoading: false, data: undefined });

    render(<AssessmentCriteriaContainer projectId="project-1" />);

    expect(screen.getByText('Failed to load project.')).toBeInTheDocument();
  });

  it('renders the project criteria and wires creation to the project', () => {
    useGetProject.mockReturnValue({
      isError: false,
      isLoading: false,
      data: {
        assessmentCriteria: [
          { criterionId: 'criterion-1', criterion: 'Clarity' },
          { criterionId: 'criterion-2', criterion: 'Evidence' },
        ],
      },
    });

    render(<AssessmentCriteriaContainer projectId="project-1" />);

    expect(screen.getByText('Project assessment criteria')).toBeInTheDocument();
    expect(screen.getAllByTestId('criterion')).toHaveLength(2);
    expect(screen.getByTestId('create-criterion')).toHaveTextContent('project-1');
    expect(useGetProject).toHaveBeenCalledWith('project-1');
  });

  it('renders nothing while the project is loading', () => {
    useGetProject.mockReturnValue({ isError: false, isLoading: true, data: undefined });

    const { container } = render(<AssessmentCriteriaContainer projectId="project-1" />);

    expect(container).toBeEmptyDOMElement();
  });
});
