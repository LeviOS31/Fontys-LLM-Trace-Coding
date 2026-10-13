import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createSpan, createTrace } from './traceFixtures';
import { TraceNav } from '../TraceNav';

const { scrollSpanIntoView } = vi.hoisted(() => ({ scrollSpanIntoView: vi.fn() }));

vi.mock('../spanScroll', () => ({ scrollSpanIntoView }));

describe('TraceNav', () => {
  it('shows spans and navigates to a selected span', () => {
    const span = createSpan('span-1', 'HTTP request', { spanKind: 'Server' });
    const trace = createTrace([span]);

    render(<TraceNav trace={trace} scrollSpanIndex="span-1" />);
    expect(screen.getByText('HTTP request')).toBeInTheDocument();
    fireEvent.click(screen.getByText('HTTP request'));

    expect(scrollSpanIntoView).toHaveBeenCalledWith('span-1');
  });
});
