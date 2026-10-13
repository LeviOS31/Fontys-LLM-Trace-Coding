import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import BarChartStats from '../ProjectAnalyticsCard/Components/BarChartStats';

vi.mock('@visx/responsive', () => ({
  ParentSize: ({ children }: { children: (size: { width: number; height: number }) => React.ReactNode }) =>
    children({ width: 500, height: 280 }),
}));

describe('BarChartStats', () => {
  it('renders chart labels and values', () => {
    render(
      <BarChartStats
        title="Trace counts"
        subtitle="Counts by version"
        data={[
          { key: 'First', value: 3 },
          { key: 'Second', value: 7 },
        ]}
      />
    );

    expect(screen.getByRole('heading', { name: 'Trace counts' })).toBeInTheDocument();
    expect(screen.getByText('Counts by version')).toBeInTheDocument();
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('renders loading skeletons without chart bars', () => {
    render(<BarChartStats title="Trace counts" data={[]} loading />);

    expect(screen.getByRole('heading', { name: 'Trace counts' })).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(document.querySelector('svg')).not.toBeInTheDocument();
  });
});
