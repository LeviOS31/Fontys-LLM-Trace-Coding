import { TextField } from '@radix-ui/themes';
import { useUpdateAssessmentCriterion } from '../hooks/useUpdateAssessmentCriterion.ts';
import type { FocusEvent } from 'react';
import { useDeleteAssessmentCriterion } from '../hooks/useDeleteAssessmentCriterion.ts';
import { ASSESSMENT_CRITERION_MAX_LENGTH } from '../../../shared/types/assessmentCriterion.ts';

interface EditAssessmentCriterionProps {
  readonly criterionId: string;
  readonly initialValue: string;
  readonly setIsEditing: (isEditing: boolean) => void;
}

export function EditAssessmentCriterion({
  criterionId,
  initialValue,
  setIsEditing,
}: EditAssessmentCriterionProps) {
  const { mutate: updateCriterion } = useUpdateAssessmentCriterion();
  const { mutate: deleteCriterion } = useDeleteAssessmentCriterion();

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.currentTarget.blur();
    }

    if (event.key === 'Escape') {
      setIsEditing(false);
    }
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    const newValue = event.target.value.trim().substring(0, ASSESSMENT_CRITERION_MAX_LENGTH);

    if (!newValue || newValue.length === 0) {
      deleteCriterion(criterionId);
      return;
    }

    if (newValue && newValue !== initialValue) {
      updateCriterion({ criterionId, criterion: newValue });
    }

    setIsEditing(false);
  };

  return (
    <TextField.Root
      defaultValue={initialValue}
      onBlur={handleBlur}
      maxLength={ASSESSMENT_CRITERION_MAX_LENGTH}
      style={{ width: '100%' }}
      onKeyDown={onKeyDown}
      autoFocus
    >
      <TextField.Slot />
    </TextField.Root>
  );
}
