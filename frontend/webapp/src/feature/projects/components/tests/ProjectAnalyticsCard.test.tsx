import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Project } from '../../../../shared/types/project';
import type { ProjectStatistics } from '../../../../shared/types/statistics.dto';
import ProjectAnalyticsCard from '../ProjectAnalyticsCard/ProjectAnalyticsCard';

const { useGetProject, useProjectStatistics, axialCodesToSnapshot } = vi.hoisted(() => ({
  useGetProject: vi.fn(),
  useProjectStatistics: vi.fn(),
  axialCodesToSnapshot: vi.fn(),
}));
vi.mock('../../hooks/useGetProject.ts', () => ({ useGetProject }));
vi.mock('../../hooks/useProjectStatistics.ts', () => ({ useProjectStatistics }));
vi.mock('../../../../shared/util/axialCodesToSnapshot.ts', () => ({ axialCodesToSnapshot }));
vi.mock('../../../../shared/components/ObjectCounterBox.tsx', () => ({
  default: ({ label, value }: { label: string; value: string | number }) => (
    <div>{label}: {value}</div>
  ),
}));
vi.mock('../ProjectAnalyticsCard/Components/BarChartStats.tsx', () => ({
  default: ({ title, data }: { title: string; data: { key: string; value: number }[] }) => (
    <div data-testid="bar-chart">{title}: {data.map(({ key, value }) => `${key}=${value}`).join(',')}</div>
  ),
}));
vi.mock('../../../../shared/components/SnapshotTreemap.tsx', () => ({
  default: ({ snapshotA }: { snapshotA: unknown }) => (
    <div data-testid="snapshot">{JSON.stringify(snapshotA)}</div>
  ),
}));

const project: Project = {
  projectId: 'project-1',
  userId: 'user-1',
  name: 'Study',
  description: '',
  assessmentCriteria: [],
  versions: [
    { versionId: 'version-1', projectId: 'project-1', name: 'First', description: 'Earlier' },
    { versionId: 'version-2', projectId: 'project-1', name: 'Second', description: 'Latest' },
  ],
};
const stats: ProjectStatistics = {
  totalTraceCount: 10,
  versionTotalTraceCount: { First: 4, Second: 6 },
  totalOpenCodeCount: 9,
  totalAxialCodeCount: 2,
  versionAxialCodes: {
    First: [{ label: 'Earlier code', description: '', openCodeCount: 3 }],
    Second: [
      { label: 'Largest code', description: '', openCodeCount: 4 },
      { label: 'Other code', description: '', openCodeCount: 2 },
    ],
  },
};

describe('ProjectAnalyticsCard', () => {
  it('renders project totals, per-version chart, largest code, and latest snapshot', () => {
    useGetProject.mockReturnValue({ data: project, isLoading: false });
    useProjectStatistics.mockReturnValue({ data: stats, isLoading: false });
    axialCodesToSnapshot.mockReturnValue({ snapshotId: 'snapshot-1' });
    render(<ProjectAnalyticsCard projectId="project-1" />);

    expect(screen.getByText('Total Versions: 2')).toBeInTheDocument();
    expect(screen.getByText('Total Traces: 10')).toBeInTheDocument();
    expect(screen.getByText('Total Open codes: 9')).toBeInTheDocument();
    expect(screen.getByText('Total Axial codes: 2')).toBeInTheDocument();
    expect(screen.getByText('Avg open codes per axial code: 3.0')).toBeInTheDocument();
    expect(screen.getByText('Largest Axial Code: Largest code')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toHaveTextContent('First=4,Second=6');
    expect(axialCodesToSnapshot).toHaveBeenCalledWith(
      stats.versionAxialCodes.Second,
      'Second',
      6,
      6
    );
    expect(screen.getByTestId('snapshot')).toBeInTheDocument();
  });

  it('omits snapshot when no version has axial codes', () => {
    useGetProject.mockReturnValue({ data: project, isLoading: false });
    useProjectStatistics.mockReturnValue({
      data: { ...stats, versionAxialCodes: {} },
      isLoading: false,
    });
    render(<ProjectAnalyticsCard projectId="project-1" />);

    expect(screen.queryByTestId('snapshot')).not.toBeInTheDocument();
    expect(screen.getByText('Largest Axial Code: —')).toBeInTheDocument();
  });
});
