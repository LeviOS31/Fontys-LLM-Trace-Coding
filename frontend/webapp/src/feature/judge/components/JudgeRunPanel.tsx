import { Box, Button, Callout, Flex, SegmentedControl, Spinner, Text } from '@radix-ui/themes';
import { AlertCircle, FlaskConical, Gavel } from 'lucide-react';
import type { JudgeTemplate, RunError } from '../hooks/judgeUtils';
import JudgeTemplateSelect from './JudgeTemplateSelect';
import TraceCollectionSelect from './TraceCollectionSelect';
import { colors } from '../../../shared/styling/colors';
import styles from './JudgeRunPanel.module.css';
import TemplatePreviewList from './TemplatePreviewList';
import RawDataSelect from './RawdataSelect';
import type { RawData } from '../hooks/rawDataUtils';

export type JudgeMode = 'testing' | 'run';

type Props = {
  readonly templates: JudgeTemplate[];
  readonly onTemplateChange: (ids: string[]) => void;
  readonly rawdatas: RawData[];
  readonly onRawDataChange: (ids: string[]) => void;
  readonly mode: JudgeMode;
  readonly onModeChange: (mode: JudgeMode) => void;
  readonly onRun: () => void;
  readonly canRun: boolean;
  readonly loading: boolean;
  readonly error: RunError | null;
  readonly projectId?: string;
  readonly versionId?: string;
  readonly description?: string;
  readonly template?: string;
  readonly onCollectionChange: (ids: string[]) => void;
  readonly selectedTemplates: JudgeTemplate[];
  readonly onEditTemplate: (templateId: string) => void;
};

export default function RunJudgePanel({
  templates,
  onTemplateChange,
  mode,
  onModeChange,
  onRawDataChange,
  onRun,
  canRun,
  loading,
  error,
  projectId,
  versionId,
  onCollectionChange,
  selectedTemplates,
  onEditTemplate,
}: Props) {
  return (
    <Box
      style={{
        background: mode === 'run' ? `var(--${colors.theme.radix.primary}-2)` : `var(--purple-2)`,
        border:  mode === 'run' ? `1px solid var(--${colors.theme.radix.primary}-6)` : `1px solid var(--purple-6)`,
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
            onValueChange={(v) => {
              console.log('SegmentedControl value:', v, 'Current mode prop:', mode);
              onModeChange(v as JudgeMode);
            }}
            radius="full"
            style={{ alignSelf: 'flex-start' }}
          >
            <SegmentedControl.Item value="run">Evaluate data</SegmentedControl.Item>
            <SegmentedControl.Item value="testing">Test templates</SegmentedControl.Item>
          </SegmentedControl.Root>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr' }}>
            {mode === 'testing' && (
              <div style={{ gridArea: '1 / 1' }}>
                <JudgeTemplateSelect
                  templates={templates}
                  onChange={(updatedIds: string[]) => onTemplateChange(updatedIds)}
                />
              </div>
            ) || (
              <div style={{ gridArea: '1 / 1' }}>
                <RawDataSelect
                  projectId={projectId}
                  versionId={versionId}
                  onChange={onRawDataChange}
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

          {mode === 'testing' && selectedTemplates.length > 0 && (
            <TemplatePreviewList templates={selectedTemplates} onEdit={onEditTemplate} />
          )}

          {mode === 'run' && (
            <Text size="2" color="gray">
              Judging with all {templates.length} active templates.
            </Text>
          )}

          <Button
            type="submit"
            disabled={!canRun}
            className={mode === 'run' ? styles.runButton : styles.testingButton}
          >
            {loading ? <Spinner /> : mode === 'run' ? <Gavel size={16} /> : <FlaskConical size={16} />}
            {loading ? 'Running judge' : mode === 'run' ? 'Run judge' : 'Test judge'}
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