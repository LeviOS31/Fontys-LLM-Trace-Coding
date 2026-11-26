import { EditJudgeTemplateModal } from '../../judgeTemplate/components/EditJudgeTemplateModal.tsx';
import { useUpdateJudgeTemplate } from '../../judgeTemplate/hooks/useUpdateJudgeTemplate.ts';
import { useRestoreJudgeTemplateVersion } from '../../judgeTemplate/hooks/useRestoreJudgeTemplateVersion.ts';
import { useDeleteJudgeTemplate } from '../../judgeTemplate/hooks/useDeleteJudgeTemplate.ts';
import type { JudgeTemplate } from '../hooks/judgeUtils';

type Props = {
  readonly template: JudgeTemplate;
  readonly projectId: string;
  readonly versionId: string;
  readonly onClose: () => void;
  readonly onChanged: () => void;
};

export default function TemplateEditor({ template, projectId, versionId, onClose, onChanged }: Props) {
  const { mutate: update, isPending: isSaving } = useUpdateJudgeTemplate(projectId, versionId);
  const { mutate: restore, isPending: isRestoring } = useRestoreJudgeTemplateVersion(projectId, versionId);
  const { mutate: remove } = useDeleteJudgeTemplate(projectId, versionId);

  const done = () => {
    onChanged();
    onClose();
  };

  return (
    <EditJudgeTemplateModal
      template={template}
      projectId={projectId}
      projectVersionId={versionId}
      onClose={onClose}
      onSave={(id, content) => update({ judgeTemplateId: id, content }, { onSuccess: done })}
      onRestore={(id, versionNumber) =>
        restore({ judgeTemplateId: id, versionNumber }, { onSuccess: onChanged })
      }
      onDelete={(id) => remove(id, { onSuccess: done })}
      isSaving={isSaving}
      isRestoring={isRestoring}
    />
  );
}