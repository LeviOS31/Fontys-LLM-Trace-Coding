import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createTrace } from '../../traceGroup/trace/tests/traceFixtures';
import { TraceAxialCodeBadge } from '../TraceAxialCodeBadge';

const { resolveStatus } = vi.hoisted(() => ({ resolveStatus: vi.fn() }));

vi.mock('../../hooks/useAxialCodeTraceStatus', () => ({
  useAxialCodeTraceStatus: () => resolveStatus,
}));

vi.mock('@radix-ui/themes', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@radix-ui/themes')>();
  return {
    ...actual,
    Tooltip: ({ children }: { children: React.ReactNode }) => children,
  };
});

describe('TraceAxialCodeBadge', () => {
  it('renders no badge when the trace has no axial code', () => {
    resolveStatus.mockReturnValue({
      hasAxialCode: false,
      needsUpdate: false,
      labels: [],
      reasons: [],
    });

    const { container } = render(
      <TraceAxialCodeBadge trace={createTrace()} projectId="project-1" versionId="version-1" />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('shows the axial-coded state and stale warning when needed', () => {
    resolveStatus.mockReturnValue({
      hasAxialCode: true,
      needsUpdate: true,
      labels: ['Usability', 'Reliability'],
      reasons: [],
    });

    render(
      <TraceAxialCodeBadge trace={createTrace()} projectId="project-1" versionId="version-1" />
    );

    expect(screen.getByText('Axial coded')).toBeInTheDocument();
    expect(screen.getByText('Needs update')).toBeInTheDocument();
  });

  it('explains why the trace belongs to each axial code when the badge is clicked', () => {
    resolveStatus.mockReturnValue({
      hasAxialCode: true,
      needsUpdate: false,
      labels: ['Usability', 'Reliability'],
      reasons: [
        {
          label: 'Usability',
          inclusionCriteria: 'A trace fits when the user cannot find a feature',
          quote: 'could not find the button',
          justification: 'The user struggled to locate a feature',
        },
        { label: 'Reliability', inclusionCriteria: null, quote: null, justification: null },
      ],
    });

    render(
      <TraceAxialCodeBadge trace={createTrace()} projectId="project-1" versionId="version-1" />
    );

    expect(screen.queryByText('The user struggled to locate a feature')).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Why this trace is in axial codes: Usability, Reliability',
      })
    );

    expect(screen.getByText('Usability')).toBeInTheDocument();
    expect(
      screen.getByText('Fits when: A trace fits when the user cannot find a feature')
    ).toBeInTheDocument();
    expect(screen.getByText('“could not find the button”')).toBeInTheDocument();
    expect(screen.getByText('The user struggled to locate a feature')).toBeInTheDocument();
    // Codes generated before justifications existed fall back to a hint.
    expect(screen.getByText('Reliability')).toBeInTheDocument();
    expect(
      screen.getByText('No justification available. Regenerate the axial codes to get one.')
    ).toBeInTheDocument();
  });
});
