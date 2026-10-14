import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { JudgeTemplate } from '../../../../shared/types/judgeTemplate';
import { EditJudgeTemplateModal } from '../EditJudgeTemplateModal';

const { deleteVersion, versions } = vi.hoisted(() => ({
  deleteVersion: vi.fn(),
  versions: { current: [] as { versionNumber: number; content: string; createdAt: string }[] },
}));

vi.mock('../../hooks/useGetJudgeTemplateVersions.ts', () => ({
  useGetJudgeTemplateVersions: () => ({ data: { versions: versions.current } }),
}));
vi.mock('../../hooks/useDeleteJudgeTemplateVersion.ts', () => ({
  useDeleteJudgeTemplateVersion: () => ({ mutate: deleteVersion, isPending: false }),
}));

const template: JudgeTemplate = {
  id: 'template-1',
  axialCodeId: 'axial-1',
  name: 'Communication judge',
  description: 'Reviews communication behaviors',
  template: 'Original instructions',
  isDeprecated: false,
  currentVersionNumber: 2,
};

describe('EditJudgeTemplateModal', () => {
  beforeEach(() => {
    versions.current = [];
    deleteVersion.mockReset();
  });

  it('enables save only after instruction edits and saves the draft', () => {
    const onSave = vi.fn();
    render(
      <EditJudgeTemplateModal
        template={template}
        projectId="project-1"
        projectVersionId="version-1"
        onClose={vi.fn()}
        onDelete={vi.fn()}
        onSave={onSave}
        onRestore={vi.fn()}
        isSaving={false}
        isRestoring={false}
      />
    );

    const saveButton = screen.getByRole('button', { name: 'Save' });
    expect(saveButton).toBeDisabled();
    fireEvent.change(screen.getByDisplayValue('Original instructions'), {
      target: { value: 'Updated instructions' },
    });
    expect(saveButton).toBeEnabled();
    fireEvent.click(saveButton);
    expect(onSave).toHaveBeenCalledWith('template-1', 'Updated instructions');
  });

  it('restores and deletes non-current versions but protects the current version', () => {
    versions.current = [
      { versionNumber: 1, content: 'Old', createdAt: '2026-01-01T00:00:00.000Z' },
      { versionNumber: 2, content: 'Current', createdAt: '2026-01-02T00:00:00.000Z' },
    ];
    const onRestore = vi.fn();
    render(
      <EditJudgeTemplateModal
        template={template}
        projectId="project-1"
        projectVersionId="version-1"
        onClose={vi.fn()}
        onDelete={vi.fn()}
        onSave={vi.fn()}
        onRestore={onRestore}
        isSaving={false}
        isRestoring={false}
      />
    );

    expect(screen.getByText('Version history')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Restore' }));
    expect(onRestore).toHaveBeenCalledWith('template-1', 1);
    fireEvent.click(screen.getAllByRole('button').find((button) => button.querySelector('svg.lucide-trash-2'))!);
    expect(deleteVersion).toHaveBeenCalledWith({
      judgeTemplateId: 'template-1',
      versionNumber: 1,
    });
  });
});