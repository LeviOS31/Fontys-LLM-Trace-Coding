import { Box, Button, Flex, Kbd, Text } from '@radix-ui/themes';
import { useEffect, type RefObject } from 'react';
import { RefreshCw, Gavel } from 'lucide-react';
import { colors } from '../../../../shared/styling/colors.ts';
import type { AxialCode } from '../../../../shared/types/axialCode.ts';
import { isTyping } from '../../../../shared/util/shortcutHelpers.ts';
import '../../../axialcode/components/GenerateAxailCodesPanal/GenerateAxialCodesPanel.css';

interface Props {
  readonly axialCodes: AxialCode[];
  readonly scopeAxial: string;
  readonly onScopeChange: (value: string) => void;
  readonly onCreate: () => void;
  readonly isCreating: boolean;
  readonly selectRef?: RefObject<HTMLSelectElement | null>;
}

export function CreateTemplatePanel({
  axialCodes,
  scopeAxial,
  onScopeChange,
  onCreate,
  isCreating,
  selectRef,
}: Props) {
  const selectedAxialHasId =
    scopeAxial !== 'all' && axialCodes.some((a) => a.axialCodeId === scopeAxial);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (isTyping()) return;
      if (e.key.toLowerCase() !== 'c') return;
      if (isCreating || !selectedAxialHasId) return;
      e.preventDefault();
      onCreate();
    };
    globalThis.addEventListener('keydown', handleKey);
    return () => globalThis.removeEventListener('keydown', handleKey);
  }, [isCreating, selectedAxialHasId, onCreate]);

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
            disabled={isCreating || !selectedAxialHasId}
            onClick={onCreate}
          >
            {isCreating ? <RefreshCw size={14} className="ai-icon-spin" /> : <Gavel size={14} />}
            {isCreating ? 'Creating…' : 'Create Template'}
            {!isCreating && <Kbd>C</Kbd>}
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
}
