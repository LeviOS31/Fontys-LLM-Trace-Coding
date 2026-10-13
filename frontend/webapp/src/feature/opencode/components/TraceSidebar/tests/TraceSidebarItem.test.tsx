import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { TraceGroupSummaryItem } from '../../../../../shared/types/trace';
import TraceSidebarItem from '../TraceSidebarItem';

const group: TraceGroupSummaryItem = {
  traceGroupId: 'group-1',
  groupTitle: 'Checkout flow',
  collectionName: 'Production traces',
  collectionCreatedAt: '2026-04-05T10:00:00.000Z',
  traceCount: 2,
  amountOfSpans: 3,
  amountOfOpenCodes: 1,
  amountOfAxialCodes: 2,
  needsAxialCodeUpdate: true,
};

vi.mock('@radix-ui/themes', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@radix-ui/themes')>();
  return {
    ...actual,
    Tooltip: ({ children }: { children: React.ReactNode }) => children,
  };
});

describe('TraceSidebarItem', () => {
  it('renders group counts, collection metadata, and update status', () => {
    render(<TraceSidebarItem group={group} isActive={false} onClick={vi.fn()} />);

    expect(screen.getByText('Checkout flow')).toBeInTheDocument();
    expect(screen.getByText('2 Traces')).toBeInTheDocument();
    expect(screen.getByText('3 Spans')).toBeInTheDocument();
    expect(screen.getByText('1 Open code')).toBeInTheDocument();
    expect(screen.getByText('2 Axial codes')).toBeInTheDocument();
    expect(screen.getByText('Needs update')).toBeInTheDocument();
    expect(screen.getByText('Production traces')).toBeInTheDocument();
  });

  it('marks the active group and invokes its selection callback', () => {
    const onClick = vi.fn();
    render(<TraceSidebarItem group={group} isActive onClick={onClick} />);

    const button = screen.getByTestId('trace-sidebar-item');
    expect(button).toHaveAttribute('aria-current', 'page');
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('omits badges for zero counts', () => {
    render(
      <TraceSidebarItem
        group={{
          ...group,
          traceCount: 0,
          amountOfSpans: 0,
          amountOfOpenCodes: 0,
          amountOfAxialCodes: 0,
          needsAxialCodeUpdate: false,
        }}
        isActive={false}
        onClick={vi.fn()}
      />
    );

    expect(screen.queryByText(/Trace/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Span/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Open code/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Axial code/)).not.toBeInTheDocument();
    expect(screen.queryByText('Needs update')).not.toBeInTheDocument();
  });
});
