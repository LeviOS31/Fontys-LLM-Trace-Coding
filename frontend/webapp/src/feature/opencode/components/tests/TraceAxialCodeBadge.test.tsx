import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
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
    resolveStatus.mockReturnValue({ hasAxialCode: false, needsUpdate: false, labels: [] });

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
    });

    render(
      <TraceAxialCodeBadge trace={createTrace()} projectId="project-1" versionId="version-1" />
    );

    expect(screen.getByText('Axial coded')).toBeInTheDocument();
    expect(screen.getByText('Needs update')).toBeInTheDocument();
  });
});
