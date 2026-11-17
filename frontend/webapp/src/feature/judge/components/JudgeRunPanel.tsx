import { Box, Button, Callout, Flex, SegmentedControl, Spinner, Text } from '@radix-ui/themes';
import { AlertCircle, Gavel } from 'lucide-react';
import type { JudgeTemplate, RunError } from '../hooks/judgeUtils';
import JudgeTemplateSelect from './JudgeTemplateSelect';
import TraceCollectionSelect from './TraceCollectionSelect';
import { colors } from '../../../shared/styling/colors';
import styles from './JudgeRunPanel.module.css';

export type JudgeMode = 'testing' | 'run';

type Props = {
  readonly templates: JudgeTemplate[];
  readonly onTemplateChange: (ids: string[]) => void;
  readonly mode: JudgeMode;
  readonly onModeChange: (mode: JudgeMode) => void;
  readonly onRun: () => void;
  readonly canRun: boolean;
  readonly loading: boolean;
  readonly error: RunError | null;
  readonly projectId?: string;
  readonly versionId?: string;
  readonly onCollectionChange: (ids: string[]) => void;
};

export default function RunJudgePanel({
  templates,
  onTemplateChange,
  mode,
  onModeChange,
  onRun,
  canRun,
  loading,
  error,
  projectId,
  versionId,
  onCollectionChange,
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
          if (canRun) onRun();
        }}
      >
        <Flex direction="column" gap="3">
          <SegmentedControl.Root
            className={styles.modeToggle}
            value={mode}
            onValueChange={(v) => onModeChange(v as JudgeMode)}
            radius="full"
            style={{ alignSelf: 'flex-start' }}
          >
            <SegmentedControl.Item value="run">Evaluating templates</SegmentedControl.Item>
            <SegmentedControl.Item value="testing">Testing templates</SegmentedControl.Item>
          </SegmentedControl.Root>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr' }}>
            {mode === 'testing' && (
              <div style={{ gridArea: '1 / 1' }}>
                <JudgeTemplateSelect
                  templates={templates}
                  onChange={(updatedIds: string[]) => onTemplateChange(updatedIds)}
                />
              </div>
            )}
            <div style={{ gridArea: '1 / 1', pointerEvents: 'none' }}>
              <TraceCollectionSelect
                projectId={projectId}
                versionId={versionId}
                onChange={onCollectionChange}
              />
            </div>
          </div>

          {mode === 'run' && (
            <Text size="2" color="gray">
              Judging with all {templates.length} active templates.
            </Text>
          )}

          <Button type="submit" disabled={!canRun}>
            {loading ? <Spinner /> : <Gavel size={16} />}
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