import { Flex, Text } from '@radix-ui/themes';
import type { AssessmentCriterion } from '../../../shared/types/assessmentCriterion.ts';
import { useState } from 'react';
import { Dot } from 'lucide-react';
import { DeleteAssessmentCriterion } from './DeleteAssessmentCriterion.tsx';
import { EditAssessmentCriterion } from './EditAssessmentCriterion.tsx';

interface AssessmentCriterionProps {
  readonly criterion: AssessmentCriterion;
}

export function AssessmentCriterion({ criterion }: AssessmentCriterionProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <Flex justify="between" gap="1" align="center" data-testid="assessment-criterion-row">
      <Flex align="center" gap="1" width="100%">
        <Dot />
        {isEditing ? (
          <EditAssessmentCriterion
            criterionId={criterion.criterionId}
            initialValue={criterion.criterion}
            setIsEditing={setIsEditing}
          />
        ) : (
          <Text
            data-testid="assessment-criterion-text"
            onClick={() => setIsEditing(true)}
            style={{ cursor: 'pointer' }}
          >
            {criterion.criterion}
          </Text>
        )}
      </Flex>
      <DeleteAssessmentCriterion criterionId={criterion.criterionId} />
    </Flex>
  );
}
