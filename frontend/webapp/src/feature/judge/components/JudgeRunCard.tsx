import { Badge, Box, Card, Code, Flex, Text } from '@radix-ui/themes';
import { ChevronRight } from 'lucide-react';
import { formatDate, statsFromCounts, type JudgeRunListItem } from '../hooks/judgeUtils';

type Props = {
  readonly run: JudgeRunListItem;
  readonly onSelect: (judgeRunId: string) => void;
};

export default function JudgeRunCard({ run, onSelect }: Props) {
  const stats = statsFromCounts(run);

  return (
    <Card asChild>
      <button
        type="button"
        onClick={() => onSelect(run.judgeRunId)}
        style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}
      >
        <Flex align="center" justify="between" gap="4">
          <Box>
            <Text as="p" size="3" weight="bold">
              {run.templateName}
            </Text>
            <Text as="p" size="1" color="gray" mt="1">
              {formatDate(run.createdAt)}
            </Text>
            <Code size="1" color="gray" variant="ghost">
              {run.judgeRunId}
            </Code>
          </Box>

          <Flex align="center" gap="2">
            <Badge color="gray" variant="soft" size="2">
              {stats.total} {stats.total === 1 ? 'result' : 'results'}
            </Badge>
            <Badge color="green" variant="soft" size="2">
              {stats.trueCount} true
            </Badge>
            <Badge color="red" variant="soft" size="2">
              {stats.falseCount} false
            </Badge>
            {stats.failedCount > 0 && (
              <Badge color="orange" variant="soft" size="2">
                {stats.failedCount} failed
              </Badge>
            )}
            <ChevronRight size={18} />
          </Flex>
        </Flex>
      </button>
    </Card>
  );
}
