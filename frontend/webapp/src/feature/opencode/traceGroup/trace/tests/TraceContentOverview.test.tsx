import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createTrace } from './traceFixtures';
import { TraceContentOverview } from '../TraceContentOverview';

vi.mock('../TraceContent', () => ({
  TraceContent: () => <div>Trace details content</div>,
}));

vi.mock('../ContentSubPanel', () => ({
  default: () => <div>Open-code and criteria panel</div>,
}));

describe('TraceContentOverview', () => {
  it('keeps trace details collapsed initially and toggles them open and closed', () => {
    render(
      <TraceContentOverview
        trace={createTrace()}
        projectId="project-1"
        versionId="version-1"
        setScrollSpanIndex={vi.fn()}
      />
    );

    expect(screen.queryByText('Trace details content')).not.toBeInTheDocument();
    expect(screen.getByText('Open-code and criteria panel')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Expand trace details' }));
    expect(screen.getByText('Trace details content')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Collapse trace details' }));
    expect(screen.queryByText('Trace details content')).not.toBeInTheDocument();
  });
});
