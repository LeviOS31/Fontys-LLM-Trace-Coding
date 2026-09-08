import { useState, useEffect } from 'react';
import { Box, Button, Flex, Grid, Kbd, Text } from '@radix-ui/themes';
import { RefreshCw, Sparkles, TrendingUpDown } from 'lucide-react';
import type { AxialCode as ApiAxialCode } from '../../../../shared/types/axialCode.ts';
import type { Snapshot } from '../../../../shared/types/snapshot.ts';
import { useGenerateAxialCodingResults } from '../../hooks/useGenerateAxialCodingResult.ts';
import RegenerateFeedbackModal from '../RegenerateFeedbackModal.tsx';
import { colors } from '../../../../shared/styling/colors.ts';
import styles from './InterpretationPanel.module.css';

interface InterpretationPanelProps {
  readonly snapshotA: Snapshot;
  readonly snapshotB: Snapshot;
  readonly userFeedback: string | null;
  readonly projectId: string;
  readonly projectVersionId: string;
  readonly axialCodesForRegen: ApiAxialCode[];
  readonly onRegenerated: (payload: {
    axialCodingResultId: string;
    axialCodes: ApiAxialCode[];
    feedback: string | null;
  }) => void;
  readonly onApprove: () => void;
  readonly onDiscard: () => void;
  readonly isSaving: boolean;
}

export default function InterpretationPanel({
  snapshotA,
  snapshotB,
  userFeedback,
  projectId,
  projectVersionId,
  axialCodesForRegen,
  onRegenerated,
  onApprove,
  onDiscard,
  isSaving,
}: InterpretationPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const { mutate, isPending: isRegenerating } = useGenerateAxialCodingResults(
    projectId,
    projectVersionId
  );

  const body =
    userFeedback ??
    'No additional feedback was provided. Axial codes of version B are generated from scratch.';

  const stats = [
    { label: 'Axial codes', a: snapshotA.totals.axialCodes, b: snapshotB.totals.axialCodes },
    {
      label: 'Avg open codes / code',
      a: snapshotA.totals.avgOpenCodesPerCode,
      b: snapshotB.totals.avgOpenCodesPerCode,
    },
    { label: 'Open codes', a: snapshotA.totals.openCodes, b: snapshotB.totals.openCodes },
  ];

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'g' && e.key !== 'G') return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable)
        return;
      if (isRegenerating || isSaving) return;
      setModalOpen(true);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isRegenerating, isSaving]);

  const handleRegenerate = (feedback: string | null) => {
    setModalOpen(false);
    mutate(
      { feedback, axialCodes: axialCodesForRegen.length > 0 ? axialCodesForRegen : null },
      {
        onSuccess: (generated) => {
          const axialCodes = Array.isArray(generated) ? generated : (generated?.axialCodes ?? []);
          const axialCodingResultId =
            !Array.isArray(generated) && generated?.axialCodingResultId
              ? generated.axialCodingResultId
              : '';
          onRegenerated({ axialCodingResultId, axialCodes, feedback });
        },
      }
    );
  };

  return (
    <Box
      style={{
        background: `var(--${colors.theme.radix.primary}-2)`,
        border: `1px solid var(--${colors.theme.radix.primary}-6)`,
        borderRadius: 'var(--radius-3)',
        padding: '18px 20px',
      }}
    >
      <Flex gap="6" align="start">
        <Flex direction="column" gap="3" style={{ flex: 1, minWidth: 0 }}>
          <Flex align="center" gap="2">
            <Box style={{ color: `var(--${colors.theme.radix.primary}-11)`, display: 'flex' }}>
              <TrendingUpDown
                size={18}
                style={{ color: `var(--${colors.theme.radix.primary}-11)`, flexShrink: 0 }}
              />
            </Box>
            <Text
              size="1"
              weight="medium"
              style={{
                color: `var(--${colors.theme.radix.primary}-11)`,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Interpretation of changes
            </Text>
          </Flex>

          <Text size="4" weight="bold" style={{ lineHeight: 1.4, letterSpacing: '-0.01em' }}>
            {userFeedback ? 'Regenerated based on your feedback' : 'Generated from scratch'}
          </Text>

          <Box style={{ position: 'relative' }}>
            <Text
              as="p"
              size="2"
              style={{
                lineHeight: 1.65,
                color: 'var(--gray-11)',
                maxHeight: expanded ? 'none' : 64,
                overflow: 'hidden',
                margin: 0,
                fontStyle: userFeedback ? 'italic' : 'normal',
              }}
            >
              {userFeedback ? `"${body}"` : body}
            </Text>
            {!expanded && body.length > 120 && (
              <Box
                style={{
                  position: 'absolute',
                  inset: 'auto 0 0 0',
                  height: 24,
                  background: `linear-gradient(180deg, transparent, var(--${colors.theme.radix.primary}-2))`,
                }}
              />
            )}
          </Box>

          {body.length > 120 && (
            <Text
              asChild
              size="1"
              weight="bold"
              style={{ color: `var(--${colors.theme.radix.primary}-11)`, cursor: 'pointer' }}
            >
              <button
                type="button"
                className={styles.textBtn}
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? 'Show less' : 'Read full ↓'}
              </button>
            </Text>
          )}

          <Box pt="3" style={{ borderTop: `1px solid var(--${colors.theme.radix.primary}-5)` }}>
            <Grid columns="3" gap="4">
              {stats.map((s) => {
                const delta = s.b - s.a;
                const sign = delta > 0 ? '+' : '';
                return (
                  <Flex key={s.label} direction="column" gap="1">
                    <Text size="1" color="gray">
                      {s.label}
                    </Text>
                    <Flex align="baseline" gap="1">
                      <Text size="2" color="gray">
                        {s.a}
                      </Text>
                      <Text size="1" style={{ color: 'var(--gray-8)' }}>
                        →
                      </Text>
                      <Text size="3" weight="bold">
                        {s.b}
                      </Text>
                      {delta !== 0 && (
                        <Text
                          size="1"
                          weight="bold"
                          style={{
                            color:
                              delta > 0
                                ? `var(--${colors.theme.radix.primary}-11)`
                                : 'var(--red-11)',
                          }}
                        >
                          {sign}
                          {delta}
                        </Text>
                      )}
                    </Flex>
                  </Flex>
                );
              })}
            </Grid>
          </Box>
        </Flex>

        <Box
          style={{
            width: 1,
            background: `var(--${colors.theme.radix.primary}-5)`,
            alignSelf: 'stretch',
            flexShrink: 0,
          }}
        />

        <Flex
          direction="column"
          gap="2"
          style={{
            flexShrink: 0,
            width: 270,
            background: 'var(--color-panel-solid)',
            border: `1px solid var(--${colors.theme.radix.primary}-6)`,
            borderRadius: 'var(--radius-3)',
            padding: '14px',
          }}
        >
          <Text size="2" weight="bold">
            Version B decision
          </Text>
          <Text size="1" color="gray" style={{ lineHeight: 1.45, marginBottom: 4 }}>
            Accept this snapshot, regenerate (with feedback), or discard.
          </Text>

          <Button
            color={colors.theme.radix.primary}
            variant="solid"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={onApprove}
            disabled={isSaving || isRegenerating}
          >
            {isSaving ? 'Approving…' : 'Approve Version B'}
          </Button>

          <Button
            color={colors.theme.radix.primary}
            variant="outline"
            style={{ width: '100%', justifyContent: 'center' }}
            disabled={isRegenerating || isSaving}
            onClick={() => setModalOpen(true)}
          >
            {isRegenerating ? (
              <RefreshCw size={14} className="ai-icon-spin" />
            ) : (
              <Sparkles size={14} />
            )}
            {isRegenerating ? 'Working…' : 'Regenerate'}
            {!isRegenerating && <Kbd>G</Kbd>}
          </Button>

          <RegenerateFeedbackModal
            open={modalOpen}
            onOpenChange={setModalOpen}
            onRegenerate={handleRegenerate}
            isPending={isRegenerating}
          />

          <Button
            color="red"
            variant="soft"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={onDiscard}
            disabled={isRegenerating || isSaving}
          >
            Discard · Not approved
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
}
