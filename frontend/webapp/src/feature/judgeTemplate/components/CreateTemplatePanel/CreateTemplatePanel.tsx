import { Box, Button, Callout, Flex, Kbd, Text } from '@radix-ui/themes';
import { useEffect, type RefObject } from 'react';
import { AlertCircle, Layers, RefreshCw, Gavel } from 'lucide-react';
import { colors } from '../../../../shared/styling/colors.ts';
import type { AxialCode } from '../../../../shared/types/axialCode.ts';
import { isTyping } from '../../../../shared/util/shortcutHelpers.ts';
import type { CreateAllJudgeTemplatesResult } from '../../hooks/useCreateAllJudgeTemplates.ts';
import '../../../axialcode/components/GenerateAxailCodesPanal/GenerateAxialCodesPanel.css';

interface Props {
  readonly axialCodes: AxialCode[];
  readonly scopeAxial: string;
  readonly onScopeChange: (value: string) => void;
  readonly onCreate: () => void;
  readonly isCreating: boolean;
  readonly selectRef?: RefObject<HTMLSelectElement | null>;
  /** Axial codes without a template; null hides the action until this is known. */
  readonly missingCount: number | null;
  readonly onCreateAll: () => void;
  readonly isCreatingAll: boolean;
  readonly createAllResult?: CreateAllJudgeTemplatesResult;
}

export function CreateTemplatePanel({
  axialCodes,
  scopeAxial,
  onScopeChange,
  onCreate,
  isCreating,
  selectRef,
  missingCount,
  onCreateAll,
  isCreatingAll,
  createAllResult,
}: Props) {
  const selectedAxialHasId =
    scopeAxial !== 'all' && axialCodes.some((a) => a.axialCodeId === scopeAxial);
  const isBusy = isCreating || isCreatingAll;
  const failedLabels = createAllResult?.failedLabels ?? [];

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (isTyping()) return;
      if (e.key.toLowerCase() !== 'c') return;
      if (isBusy || !selectedAxialHasId) return;
      e.preventDefault();
      onCreate();
    };
    globalThis.addEventListener('keydown', handleKey);
    return () => globalThis.removeEventListener('keydown', handleKey);
  }, [isBusy, selectedAxialHasId, onCreate]);

  return (
    <Box
      style={{
        background: `var(--${colors.theme.radix.primary}-2)`,
        border: `1px solid var(--${colors.theme.radix.primary}-6)`,
        borderRadius: 'var(--radius-3)',
        padding: '14px 18px',
      }}
    >
      <Flex align="center" gap="4">
        <Gavel
          size={20}
          style={{ color: `var(--${colors.theme.radix.primary}-11)`, flexShrink: 0 }}
        />

        <Box flexGrow="1">
          <Text as="div" size="2" weight="bold">
            Create Judge Template
          </Text>
          <Text as="div" size="2" color="gray">
            Select an axial code to create a judge template scoped to it.
          </Text>
        </Box>

        <Flex align="center" gap="2" flexShrink="0">
          <select
            ref={selectRef}
            value={scopeAxial}
            onChange={(e) => onScopeChange(e.target.value)}
            style={{
              height: 34,
              padding: '0 30px 0 12px',
              background: '#FFFFFF',
              border: '1px solid var(--gray-5)',
              borderRadius: 'var(--radius-2)',
              fontSize: 12.5,
              color: 'var(--gray-12)',
              cursor: 'pointer',
              appearance: 'none',
              fontFamily: 'var(--font-mono)',
              minWidth: 220,
              outline: 'none',
            }}
          >
            <option value="all">Select axial code…</option>
            {axialCodes.map((a) => (
              <option key={a.axialCodeId ?? a.label} value={a.axialCodeId ?? ''}>
                {a.label}
              </option>
            ))}
          </select>

          <Button
            size="2"
            color={colors.theme.radix.primary}
            variant="solid"
            disabled={isBusy || !selectedAxialHasId}
            onClick={onCreate}
          >
            {isCreating ? <RefreshCw size={14} className="ai-icon-spin" /> : <Gavel size={14} />}
            {isCreating ? 'Creating…' : 'Create Template'}
            {!isCreating && <Kbd>C</Kbd>}
          </Button>
        </Flex>
      </Flex>

      {missingCount !== null && (
        <Flex
          align="center"
          justify="between"
          gap="4"
          mt="3"
          pt="3"
          style={{ borderTop: `1px solid var(--${colors.theme.radix.primary}-6)` }}
        >
          <Text size="2" color="gray" data-testid="missing-templates-count">
            {missingCount === 0
              ? 'Every axial code has a judge template.'
              : `${missingCount} axial ${missingCount === 1 ? 'code has' : 'codes have'} no judge template yet.`}
          </Text>
          <Button
            size="2"
            variant="soft"
            color={colors.theme.radix.primary}
            disabled={isBusy || missingCount === 0}
            onClick={onCreateAll}
            style={{ flexShrink: 0 }}
          >
            {isCreatingAll ? (
              <RefreshCw size={14} className="ai-icon-spin" />
            ) : (
              <Layers size={14} />
            )}
            {isCreatingAll ? 'Creating all…' : 'Create all templates'}
          </Button>
        </Flex>
      )}

      {failedLabels.length > 0 && createAllResult && (
        <Callout.Root color="red" size="1" mt="3" role="alert">
          <Callout.Icon>
            <AlertCircle size={16} />
          </Callout.Icon>
          <Callout.Text>
            Created {createAllResult.createdCount} of{' '}
            {createAllResult.createdCount + failedLabels.length} templates. Could not create:{' '}
            {failedLabels.join(', ')}. Click Create all templates to try again.
          </Callout.Text>
        </Callout.Root>
      )}
    </Box>
  );
}
