import { useState, useEffect } from 'react';
import type { AxialCode } from '../../../../shared/types/axialCode.ts';
import { useGenerateAxialCodingResults } from '../../hooks/useGenerateAxialCodingResult.ts';
import { useGetOpenCodesByVersion } from '../../hooks/useGetOpenCodesByVersion.ts';
import { Button, Kbd, Text, Box, Flex } from '@radix-ui/themes';
import { Sparkles, RefreshCw } from 'lucide-react';
import RegenerateFeedbackModal from '../RegenerateFeedbackModal.tsx';
import { colors } from '../../../../shared/styling/colors.ts';

type Props = {
  projectId: string;
  projectVersionId: string;
  axialCodes?: AxialCode[];
  onGenerated?: (payload: {
    axialCodingResultId: string;
    axialCodes: AxialCode[];
    feedback: string | null;
  }) => void;
};

export function GenerateAxialCodesPanel({
  projectId,
  projectVersionId,
  axialCodes,
  onGenerated,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  const { mutate, isPending } = useGenerateAxialCodingResults(projectId, projectVersionId);
  const { data: openCodes } = useGetOpenCodesByVersion(projectId, projectVersionId);

  const isRegenerate = axialCodes && axialCodes.length > 0;
  const openCodeCount = openCodes?.length;

  const handleGenerate = (feedback: string | null) => {
    const normalizedAxialCodes = axialCodes && axialCodes.length > 0 ? axialCodes : null;
    setModalOpen(false);
    mutate(
      { feedback, axialCodes: normalizedAxialCodes },
      {
        onSuccess: (generated) => {
          const generatedAxialCodes = Array.isArray(generated)
            ? generated
            : (generated?.axialCodes ?? []);
          const axialCodingResultId =
            !Array.isArray(generated) && generated?.axialCodingResultId
              ? generated.axialCodingResultId
              : '';
          onGenerated?.({ axialCodingResultId, axialCodes: generatedAxialCodes, feedback });
        },
      }
    );
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'g' && e.key !== 'G') return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable)
        return;
      if (isPending) return;
      if (isRegenerate) {
        setModalOpen(true);
      } else {
        handleGenerate(null);
      }
    };
    globalThis.addEventListener('keydown', onKeyDown);
    return () => globalThis.removeEventListener('keydown', onKeyDown);
  }, [handleGenerate, isPending, isRegenerate]);

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
        <Sparkles
          size={20}
          style={{ color: `var(--${colors.theme.radix.primary}-11)`, flexShrink: 0 }}
        />

        {/* Title + subtitle */}
        <Box flexGrow="1">
          <Text as="div" size="2" weight="bold">
            {isRegenerate ? 'Regenerate Axial Codes' : 'Generate Axial Codes'}
          </Text>
          <Text as="div" size="2" color="gray">
            {isRegenerate
              ? `Regenerate based on ${openCodeCount ?? '...'} open codes`
              : `Generate axial codes based on ${openCodeCount ?? '...'} open codes`}
          </Text>
        </Box>

        {/* Actions */}
        <Flex align="center" gap="2" flexShrink="0">
          {isRegenerate ? (
            <Button
              size="2"
              color={colors.theme.radix.primary}
              variant="solid"
              disabled={isPending}
              onClick={() => setModalOpen(true)}
            >
              {isPending ? (
                <RefreshCw size={14} className="ai-icon-spin" />
              ) : (
                <Sparkles size={14} />
              )}
              {isPending ? 'Working...' : 'Regenerate'}
              {!isPending && <Kbd>G</Kbd>}
            </Button>
          ) : (
            <Button
              size="2"
              color={colors.theme.radix.primary}
              variant="solid"
              disabled={isPending}
              onClick={() => handleGenerate(null)}
            >
              {isPending ? (
                <RefreshCw size={14} className="ai-icon-spin" />
              ) : (
                <Sparkles size={14} />
              )}
              {isPending ? 'Working...' : 'Generate Axial Codes'}
              {!isPending && <Kbd>G</Kbd>}
            </Button>
          )}
        </Flex>
      </Flex>

      {isRegenerate && (
        <RegenerateFeedbackModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          onRegenerate={handleGenerate}
          isPending={isPending}
        />
      )}
    </Box>
  );
}
