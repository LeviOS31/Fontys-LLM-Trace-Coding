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

  it('shows the judge guidelines and why each open code belongs when expanded', () => {
    render(
      <AxialCodeCard
        code={{
          ...code,
          judgeGuidelines:
            'Mark true when: the model states a policy that does not exist.\nMark false when: the model quotes a real policy.\nBorderline cases: hedged statements count as false.',
          justifications: [
            {
              traceId: 'trace-1',
              quote: 'Invented warranty',
              justification: 'The open code describes made-up warranty terms',
            },
          ],
        }}
        snap="A"
      />
    );

    expect(screen.queryByTestId('axial-code-judge-guidelines')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Expand details ↓' }));

    const guidelines = screen.getByTestId('axial-code-judge-guidelines');
    expect(guidelines).toHaveTextContent('Judge guidelines');
    expect(guidelines).toHaveTextContent('Derived from the open codes in this group');
    expect(guidelines).toHaveTextContent(
      'Mark true when: the model states a policy that does not exist.'
    );
    expect(guidelines).toHaveTextContent('Borderline cases: hedged statements count as false.');

    expect(screen.getByText('Why these open codes belong here')).toBeInTheDocument();
    const justification = screen.getByTestId('axial-code-justification');
    expect(justification).toHaveTextContent('“Invented warranty”');
    expect(justification).toHaveTextContent('The open code describes made-up warranty terms');
    // The plain open-code badges are replaced by the justifications.
    expect(screen.queryByText('Made-up refund rule')).not.toBeInTheDocument();
  });

  it('shows no judge guidelines for codes generated before they existed', () => {
    render(<AxialCodeCard code={code} snap="A" />);

    fireEvent.click(screen.getByRole('button', { name: 'Expand details ↓' }));

    expect(screen.queryByTestId('axial-code-judge-guidelines')).not.toBeInTheDocument();
    expect(screen.getByText('Open codes')).toBeInTheDocument();
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
