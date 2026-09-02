import { Button, Flex, TextField, Tooltip } from '@radix-ui/themes';
import { PlusIcon } from 'lucide-react';
import { useState, type KeyboardEvent } from 'react';
import {
  ASSESSMENT_CRITERION_MAX_LENGTH,
  ASSESSMENT_CRITERION_MIN_LENGTH,
} from '../../../shared/types/assessmentCriterion.ts';
import { useCreateAssessmentCriterion } from '../hooks/useCreateAssessmentCriterion.ts';

export function CreateAssessmentCriterion() {
  const [criterion, setCriterion] = useState('');
  const criterionIsValid =
    criterion.trim().length > ASSESSMENT_CRITERION_MIN_LENGTH &&
    criterion.trim().length < ASSESSMENT_CRITERION_MAX_LENGTH;
  const { mutate: createCriterion, isPending } = useCreateAssessmentCriterion();

  function submit() {
    if (!criterionIsValid || isPending) return;

    createCriterion(criterion.trim(), {
      onSuccess: () => {
        setCriterion('');
      },
    });
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') submit();
  }

  return (
    <Flex mt="3" gap="1" width="100%">
      <TextField.Root
        data-testid="assessment-criterion-create-input"
        style={{ width: '100%' }}
        value={criterion}
        onChange={(e) => setCriterion(e.target.value)}
        onKeyDown={onKeyDown}
        maxLength={ASSESSMENT_CRITERION_MAX_LENGTH}
        disabled={isPending}
        placeholder="Add new assessment criterion"
      >
        <TextField.Slot />
      </TextField.Root>

      <Tooltip content="Press Enter to create">
        <Button
          variant="soft"
          onClick={submit}
          disabled={isPending || !criterionIsValid}
          data-testid="assessment-criterion-create-button"
        >
          <PlusIcon size={16} />
        </Button>
      </Tooltip>
    </Flex>
  );
}
