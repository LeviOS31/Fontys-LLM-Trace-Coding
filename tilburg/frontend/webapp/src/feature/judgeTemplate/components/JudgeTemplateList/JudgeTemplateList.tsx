import { Box, Flex, Text } from '@radix-ui/themes';
import type { JudgeTemplate } from '../../../../shared/types/judgeTemplate.ts';
import { JudgeTemplateRow } from '../JudgeTemplateRow.tsx';
import './JudgeTemplateList.css';

interface Props {
  templates: JudgeTemplate[];
  axialCodeById: Record<string, string>;
  focusedIndex: number;
  onOpen: (t: JudgeTemplate) => void;
  onDelete: (id: string) => void;
}

export function JudgeTemplateList({
  templates,
  axialCodeById,
  focusedIndex,
  onOpen,
  onDelete,
}: Props) {
  return (
    <Box
      style={{
        border: '1px solid var(--gray-a5)',
        borderRadius: 'var(--radius-3)',
        overflow: 'hidden',
      }}
    >
      <Flex
        align="center"
        justify="between"
        px="3"
        py="2"
        style={{ background: 'var(--gray-a2)', borderBottom: '1px solid var(--gray-a5)' }}
      >
        <Text
          size="1"
          weight="bold"
          color="gray"
          style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}
        >
          Judge templates
        </Text>
        <Text size="1" color="gray">
          {templates.length} {templates.length === 1 ? 'template' : 'templates'}
        </Text>
      </Flex>

      {templates.map((t, i) => (
        <JudgeTemplateRow
          key={t.id}
          template={t}
          axialCodeLabel={axialCodeById[t.id]}
          isFocused={i === focusedIndex}
          onOpen={onOpen}
          onDelete={onDelete}
        />
      ))}

      {templates.length === 0 && (
        <Flex justify="center" py="8">
          <Text size="2" color="gray">
            No templates match your filters.
          </Text>
        </Flex>
      )}
    </Box>
  );
}
