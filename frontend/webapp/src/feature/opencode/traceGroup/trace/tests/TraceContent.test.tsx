import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createSpan, createTrace, stringAttribute } from './traceFixtures';
import { TraceContent } from '../TraceContent';

vi.mock('../../../components/TraceAxialCodeBadge', () => ({
  TraceAxialCodeBadge: () => <div data-testid="axial-status" />,
}));

describe('TraceContent', () => {
  it('renders trace identity, resources, visible attributes, timestamps, and duration', () => {
    const trace = createTrace(
      [
        createSpan('span-1', 'request', {
          startTimeUnixNano: 1_000_000,
          endTimeUnixNano: 4_000_000,
          attributes: [
            stringAttribute('http.method', 'GET'),
            stringAttribute('gen_ai.prompt.0.content', 'hidden prompt'),
            stringAttribute('traceloop.entity.input', 'hidden input'),
          ],
        }),
      ],
      {
        traceResources: [stringAttribute('service.name', 'checkout-api')],
      }
    );

    render(<TraceContent trace={trace} projectId="project-1" versionId="version-1" />);

    expect(screen.getByRole('heading', { name: 'Trace' })).toBeInTheDocument();
    expect(screen.getByText('trace-1')).toBeInTheDocument();
    expect(screen.getByText('checkout-api')).toBeInTheDocument();
    expect(screen.getByText('HTTP')).toBeInTheDocument();
    expect(screen.getByText('GET')).toBeInTheDocument();
    expect(screen.getByText('3 ms')).toBeInTheDocument();
    expect(screen.queryByText('hidden prompt')).not.toBeInTheDocument();
    expect(screen.queryByText('hidden input')).not.toBeInTheDocument();
    expect(screen.getByTestId('axial-status')).toBeInTheDocument();
  });
});
