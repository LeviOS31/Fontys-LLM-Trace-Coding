import { Box, Button, Callout, Flex, Spinner } from '@radix-ui/themes';import { AlertCircle } from 'lucide-react';
import type { JudgeTemplate, RunError } from '../hooks/judgeUtils';
import JudgeTemplateSelect from './JudgeTemplateSelect';
import { colors } from '../../../shared/styling/colors';

type Props = {
  readonly templates: JudgeTemplate[];
  readonly onTemplateChange: (ids: string[]) => void;
  readonly onRun: () => void;
  readonly canRun: boolean;
  readonly loading: boolean;
  readonly error: RunError | null;
};

export default function RunJudgePanel({
  templates,
  onTemplateChange,
  onRun,
  canRun,
  loading,
  error,
}: Props) {

  return (
    <Box
      style={{
        background: `var(--${colors.theme.radix.primary}-2)`,
        border: `1px solid var(--${colors.theme.radix.primary}-6)`,
        borderRadius: 'var(--radius-3)',
        padding: '14px 18px',
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (canRun) onRun()
        }}
      >
        <Flex direction="column" gap="3">

          <JudgeTemplateSelect
            templates={templates}
            onChange={(updatedIds) => onTemplateChange(updatedIds)}
          />

            <Button type="submit" disabled={!canRun}>
              <Spinner loading={loading} />
              {loading ? 'Running judge' : 'Run judge'}
            </Button>

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
    </Box>
  );
}
