import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { AxialCodeSnapshotCode } from '../../../shared/types/axialCodeSnapshotCode';
import AxialCodeCard from './AxialCodeCard/AxialCodeCard';

const code: AxialCodeSnapshotCode = {
  id: 'code-1',
  name: 'Hallucinated policies',
  description: 'The model invents policy details.',
  prevalence: 60,
  traceCount: 3,
  openCodeCount: 4,
  traceIds: ['trace-1'],
  sampleTraces: ['trace-1'],
  sampleOpenCodes: ['Invented warranty terms', 'Made-up refund rule'],
  color: '#123456',
  changeKind: 'renamed',
  derivedFrom: ['Old policy errors'],
  addedTraceIds: ['trace-2'],
  removedTraceIds: ['trace-3', 'trace-4'],
};

describe('AxialCodeCard', () => {
  it('shows code details and expands/collapses its sample open codes', () => {
    render(<AxialCodeCard code={code} snap="B" />);

    expect(screen.getByText('Hallucinated policies')).toBeInTheDocument();
    expect(screen.getByText('The model invents policy details.')).toBeInTheDocument();
    expect(screen.getByText('Was')).toBeInTheDocument();
    expect(screen.getByText('Old policy errors')).toBeInTheDocument();
    expect(screen.getByText('+1 open code')).toBeInTheDocument();
    expect(screen.getByText('−2 open codes')).toBeInTheDocument();
    expect(screen.queryByText('Invented warranty terms')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Expand details ↓' }));
    expect(screen.getByText('Invented warranty terms')).toBeInTheDocument();
    expect(screen.getByText('Made-up refund rule')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Collapse ↑' }));
    expect(screen.queryByText('Invented warranty terms')).not.toBeInTheDocument();
  });

  it('shows when a trace fits and why each trace fits when expanded', () => {
    render(
      <AxialCodeCard
        code={{
          ...code,
          inclusionCriteria: 'A trace fits when the model states a policy that does not exist',
          justifications: [
            {
              traceId: 'trace-1',
              openCode: 'Invented warranty terms',
              quote: 'Invented warranty',
              justification: 'The model made up warranty terms',
            },
          ],
        }}
        snap="A"
      />
    );

    expect(screen.getByText('Fits when')).toBeInTheDocument();
    expect(
      screen.getByText('A trace fits when the model states a policy that does not exist')
    ).toBeInTheDocument();
    expect(screen.queryByText('The model made up warranty terms')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Expand details ↓' }));

    expect(screen.getByText('Why these traces fit')).toBeInTheDocument();
    const justification = screen.getByTestId('axial-code-justification');
    expect(justification).toHaveTextContent('Invented warranty terms');
    expect(justification).toHaveTextContent('“Invented warranty”');
    expect(justification).toHaveTextContent('The model made up warranty terms');
    // The plain open-code badges are replaced by the justifications.
    expect(screen.queryByText('Made-up refund rule')).not.toBeInTheDocument();
  });

  it('hides the inclusion criteria for codes generated before justifications existed', () => {
    render(<AxialCodeCard code={code} snap="A" />);

    expect(screen.queryByTestId('axial-code-inclusion-criteria')).not.toBeInTheDocument();
  });

  it('reports hover and leave with the snapshot identity', () => {
    const onHover = vi.fn();
    render(<AxialCodeCard code={code} snap="A" onHover={onHover} />);
    const card = screen.getByTestId('axial-code-card');

    fireEvent.mouseEnter(card);
    expect(onHover).toHaveBeenLastCalledWith({ ...code, _snap: 'A' });

    fireEvent.mouseLeave(card);
    expect(onHover).toHaveBeenLastCalledWith(null);
  });
});
