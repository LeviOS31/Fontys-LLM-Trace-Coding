import { Box, Button, Callout, Card, Flex, Select, Spinner, Text } from '@radix-ui/themes';
import { AlertCircle } from 'lucide-react';
import type { JudgeTemplate, RunError } from '../hooks/judgeUtils';

type Props = {
  readonly templates: JudgeTemplate[];
  readonly templateId: string;
  readonly onTemplateChange: (id: string) => void;
  readonly onRun: () => void;
  readonly canRun: boolean;
  readonly loading: boolean;
  readonly error: RunError | null;
};

export default function RunJudgePanel({
  templates,
  templateId,
  onTemplateChange,
  onRun,
  canRun,
  loading,
  error,
}: Props) {
  return (
    <Card>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (canRun) onRun();
        }}
      >
        <Flex direction="column" gap="3">
          <Text as="label" size="2" weight="medium" htmlFor="judge-template">
            Judge template
          </Text>
          <Flex gap="3" align="center">
            <Select.Root value={templateId} onValueChange={onTemplateChange}>
              <Select.Trigger
                id="judge-template"
                placeholder="Select a judge template"
                style={{ minWidth: 280 }}
              />
              <Select.Content>
                {templates.map((t) => (
                  <Select.Item key={t.id} value={t.id}>
                    {t.name}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
            <Button type="submit" disabled={!canRun}>
              <Spinner loading={loading} />
              {loading ? 'Running judge' : 'Run judge'}
            </Button>
          </Flex>

          {error && (
            <Callout.Root color="red" size="1">
              <Callout.Icon>
                <AlertCircle size={16} />
              </Callout.Icon>
              <Callout.Text>{error.message}</Callout.Text>
            </Callout.Root>
          )}
          {error && (
            <Box>
              <pre style={{ margin: 0, overflowX: 'auto', fontSize: 'var(--font-size-1)' }}>
                {error.raw}
              </pre>
            </Box>
          )}
        </Flex>
      </form>
    </Card>
  );
}
