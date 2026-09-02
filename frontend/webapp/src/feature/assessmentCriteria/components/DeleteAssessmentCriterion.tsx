import { Button, Flex, IconButton, Text } from '@radix-ui/themes';
import { TrashIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDeleteAssessmentCriterion } from '../hooks/useDeleteAssessmentCriterion.ts';

interface DeleteAssessmentCriterionProps {
  criterionId: string;
}

export function DeleteAssessmentCriterion({ criterionId }: DeleteAssessmentCriterionProps) {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const { mutate: deleteCriterion } = useDeleteAssessmentCriterion();

  useEffect(() => {
    if (!showDeleteConfirmation) return;

    const timer = setTimeout(() => setShowDeleteConfirmation(false), 3000);
    return () => clearTimeout(timer);
  }, [showDeleteConfirmation]);

  return showDeleteConfirmation ? (
    <Button
      color="red"
      size="1"
      onClick={() => deleteCriterion(criterionId)}
      style={{ cursor: 'pointer' }}
      data-testid="assessment-criterion-delete-confirm"
    >
      <Flex gap="1" align="center">
        <TrashIcon size="12" />
        <Text size="1">Delete</Text>
      </Flex>
    </Button>
  ) : (
    <IconButton
      color="red"
      size="1"
      onClick={() => setShowDeleteConfirmation(true)}
      style={{ cursor: 'pointer' }}
      data-testid="assessment-criterion-delete"
    >
      <TrashIcon size="12" />
    </IconButton>
  );
}
