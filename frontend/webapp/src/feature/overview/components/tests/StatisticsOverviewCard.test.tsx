import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ProjectVersionStatistics } from '../../../../shared/types/statistics.dto';
import StatisticsOverviewCard from '../StatisticsOverviewCard';

const { useVersionStatistics, snapshot } = vi.hoisted(() => ({
  useVersionStatistics: vi.fn(),
  snapshot: vi.fn(),
}));
vi.mock('../../hooks/useVersionStatistics.ts', () => ({ useVersionStatistics }));
vi.mock('../../../../shared/components/SnapshotTreemap.tsx', () => ({
  default: () => <div data-testid="snapshot-treemap" />,
}));
vi.mock('../../../../shared/util/axialCodesToSnapshot.ts', () => ({
  axialCodesToSnapshot: snapshot,
}));
vi.mock('../../../../shared/components/ObjectCounterBox.tsx', () => ({
  default: ({ label, value }: { label: string; value: string | number }) => (
    <div>
      {label}: {value}
    </div>
  ),
}));

const statistics: ProjectVersionStatistics = {
  versionTraceCount: 8,
  versionOpenCodeCount: 12,
  versionAxialCodeCount: 2,
  versionAxialCodes: [
    { label: 'Clarity', description: 'Clear communication', openCodeCount: 8 },
    { label: 'Empathy', description: 'Empathetic communication', openCodeCount: 4 },
  ],
};

describe('StatisticsOverviewCard', () => {
  it('renders totals, average, largest code, and snapshot', () => {
    useVersionStatistics.mockReturnValue({ data: statistics, isLoading: false });
    snapshot.mockReturnValue({ id: 'snapshot-1' });
    render(<StatisticsOverviewCard projectId="project-1" projectVersionId="version-1" />);

    expect(screen.getByText('Total Traces: 8')).toBeInTheDocument();
    expect(screen.getByText('Total Open codes: 12')).toBeInTheDocument();
    expect(screen.getByText('Total Axial codes: 2')).toBeInTheDocument();
    expect(screen.getByText('Avg open codes per axial code: 6.0')).toBeInTheDocument();
    expect(screen.getByText('Largest Axial Code: Clarity')).toBeInTheDocument();
    expect(screen.getByTestId('snapshot-treemap')).toBeInTheDocument();
  });

  it('omits the snapshot when there are no axial codes', () => {
    useVersionStatistics.mockReturnValue({
      data: { ...statistics, versionAxialCodes: [] },
      isLoading: false,
    });
    render(<StatisticsOverviewCard projectId="project-1" projectVersionId="version-1" />);

    expect(screen.queryByTestId('snapshot-treemap')).not.toBeInTheDocument();
    expect(screen.getByText('Largest Axial Code: —')).toBeInTheDocument();
    expect(screen.getByText('Avg open codes per axial code: 0')).toBeInTheDocument();
  });
});
