import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ChartSpline } from 'lucide-react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import type { Project } from '../../../../shared/types/project';
import { VersionPageHeader } from '../VersionPageHeader';

const { useGetProject } = vi.hoisted(() => ({ useGetProject: vi.fn() }));
vi.mock('../../../projects/hooks/useGetProject.ts', () => ({ useGetProject }));
vi.mock('../EditVersionModal.tsx', () => ({
  EditVersionModal: ({ version, open }: { version?: { name: string }; open: boolean }) =>
    open ? <div role="dialog">Edit {version?.name}</div> : null,
}));

const project: Project = {
  projectId: 'project-1',
  userId: 'user-1',
  name: 'Research',
  description: '',
  assessmentCriteria: [],
  versions: [
    {
      versionId: 'version-1',
      projectId: 'project-1',
      name: 'First analysis',
      description: 'Initial batch',
    },
  ],
};

function renderHeader() {
  return render(
    <MemoryRouter initialEntries={['/projects/project-1/versions/version-1']}>
      <Routes>
        <Route
          path="/projects/:id/versions/:versionId"
          element={<VersionPageHeader title="Overview" Icon={ChartSpline} />}
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('VersionPageHeader', () => {
  it('renders the title and opens the selected version for editing', () => {
    useGetProject.mockReturnValue({ data: project, isLoading: false });
    renderHeader();

    expect(screen.getByText('Overview')).toBeInTheDocument();
    const editButton = screen.getByRole('button', { name: 'Edit version' });
    expect(editButton).toBeEnabled();
    fireEvent.click(editButton);
    expect(screen.getByRole('dialog')).toHaveTextContent('Edit First analysis');
  });

  it('disables editing while loading or when there is no current version', () => {
    useGetProject.mockReturnValue({ data: undefined, isLoading: true });
    const { rerender } = renderHeader();
    expect(screen.getByRole('button', { name: 'Edit version' })).toBeDisabled();

    useGetProject.mockReturnValue({ data: { ...project, versions: [] }, isLoading: false });
    rerender(
      <MemoryRouter initialEntries={['/projects/project-1/versions/version-1']}>
        <Routes>
          <Route
            path="/projects/:id/versions/:versionId"
            element={<VersionPageHeader title="Overview" Icon={ChartSpline} />}
          />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByRole('button', { name: 'Edit version' })).toBeDisabled();
  });
});
