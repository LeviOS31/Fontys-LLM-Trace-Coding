import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import TemplateEditor from '../TemplateEditor';
import type { JudgeTemplate } from '../../hooks/judgeUtils';

type Opts = { onSuccess?: () => void };
const update = vi.fn((_vars: unknown, opts?: Opts) => opts?.onSuccess?.());
const restore = vi.fn((_vars: unknown, opts?: Opts) => opts?.onSuccess?.());
const remove = vi.fn((_id: string, opts?: Opts) => opts?.onSuccess?.());

vi.mock('../../judgeTemplate/hooks/useUpdateJudgeTemplate.ts', () => ({
  useUpdateJudgeTemplate: () => ({ mutate: update, isPending: false }),
}));
vi.mock('../../judgeTemplate/hooks/useRestoreJudgeTemplateVersion.ts', () => ({
  useRestoreJudgeTemplateVersion: () => ({ mutate: restore, isPending: false }),
}));
vi.mock('../../judgeTemplate/hooks/useDeleteJudgeTemplate.ts', () => ({
  useDeleteJudgeTemplate: () => ({ mutate: remove }),
}));
// Stub the real modal: it only exposes the callbacks TemplateEditor wires up.
vi.mock('../../judgeTemplate/components/EditJudgeTemplateModal.tsx', () => ({
  EditJudgeTemplateModal: (p: {
    template: { name: string };
    projectId: string;
    projectVersionId: string;
    onSave: (id: string, content: string) => void;
    onRestore: (id: string, versionNumber: number) => void;
    onDelete: (id: string) => void;
  }) => (
    <div>
      <p>{p.template.name}</p>
      <p>{`${p.projectId}/${p.projectVersionId}`}</p>
      <button onClick={() => p.onSave('t1', 'new content')}>save</button>
      <button onClick={() => p.onRestore('t1', 2)}>restore</button>
      <button onClick={() => p.onDelete('t1')}>delete</button>
    </div>
  ),
}));

const template: JudgeTemplate = {
  id: 't1',
  axialCodeId: 'a1',
  name: 'Correctness of refusal',
  description: 'd',
  template: 'prompt',
  isDeprecated: false,
};

function setup() {
  const onClose = vi.fn();
  const onChanged = vi.fn();
  render(
    <TemplateEditor
      template={template}
      projectId="p1"
      versionId="v1"
      onClose={onClose}
      onChanged={onChanged}
    />
  );
  return { onClose, onChanged };
}

describe('TemplateEditor', () => {
  beforeEach(() => vi.clearAllMocks());

  it('passes the template, project and version to the modal', () => {
    setup();
    expect(screen.getByText('Correctness of refusal')).toBeTruthy();
    expect(screen.getByText('p1/v1')).toBeTruthy();
  });

  it('saves, then refreshes the templates and closes', () => {
    const { onChanged, onClose } = setup();
    fireEvent.click(screen.getByText('save'));
    expect(update).toHaveBeenCalledWith(
      { judgeTemplateId: 't1', content: 'new content' },
      expect.any(Object)
    );
    expect(onChanged).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('restores a version and refreshes without closing', () => {
    const { onChanged, onClose } = setup();
    fireEvent.click(screen.getByText('restore'));
    expect(restore).toHaveBeenCalledWith(
      { judgeTemplateId: 't1', versionNumber: 2 },
      expect.any(Object)
    );
    expect(onChanged).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('deletes, then refreshes the templates and closes', () => {
    const { onChanged, onClose } = setup();
    fireEvent.click(screen.getByText('delete'));
    expect(remove).toHaveBeenCalledWith('t1', expect.any(Object));
    expect(onChanged).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});