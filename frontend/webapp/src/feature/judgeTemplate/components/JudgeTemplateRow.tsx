import { Badge, Box, Flex, IconButton, Text } from '@radix-ui/themes';
import { useEffect, useRef, useState } from 'react';
import { Download, Trash2, TriangleAlert } from 'lucide-react';
import type { JudgeTemplate } from '../../../shared/types/judgeTemplate.ts';
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog.tsx';

function AxialCodePill({ label }: { label: string }) {
  return (
    <Badge variant="outline" color="gray" radius="full">
      {label}
    </Badge>
  );
}

function NotSyncedPill() {
  return (
    <Badge color="amber" radius="full">
      <TriangleAlert size={10} />
      Not synced
    </Badge>
  );
}

interface Props {
  template: JudgeTemplate;
  axialCodeLabel?: string;
  isFocused?: boolean;
  onOpen: (t: JudgeTemplate) => void;
  onDelete: (id: string) => void;
}

export function JudgeTemplateRow({ template, axialCodeLabel, isFocused, onOpen, onDelete }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isFocused) rowRef.current?.scrollIntoView({ block: 'nearest' });
  }, [isFocused]);

  return (
    <>
      <Flex
        ref={rowRef}
        role="button"
        tabIndex={0}
        align="center"
        gap="3"
        px="3"
        py="3"
        className="judge-template-row"
        onClick={() => onOpen(template)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onOpen(template);
        }}
        style={{
          borderBottom: '1px solid var(--gray-a3)',
          background: isFocused ? 'var(--jade-a3)' : undefined,
          outline: isFocused ? '2px solid var(--jade-7)' : undefined,
          outlineOffset: -2,
        }}
      >
        <Box flexGrow="1" style={{ minWidth: 0 }}>
          <Text as="div" size="2" weight="bold" mb="1" style={{ letterSpacing: '-0.005em' }}>
            {template.name}
          </Text>
          <Flex align="center" gap="2" wrap="wrap">
            <Text as="span" size="1" color="gray">
              {template.description}
            </Text>
            {axialCodeLabel && <AxialCodePill label={axialCodeLabel} />}
            {template.isDeprecated && <NotSyncedPill />}
          </Flex>
        </Box>

        {/* Wrapper stops the row's onClick from firing when clicking action buttons */}
        <Flex gap="2" flexShrink="0" onClick={(e) => e.stopPropagation()}>
          <IconButton
            variant="ghost"
            color="gray"
            size="1"
            aria-label="Export template"
            title="Export judge instructions"
            onClick={() => {
              const blob = new Blob([template.template], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${template.name}.txt`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
          >
            <Download size={20} />
          </IconButton>

          <IconButton
            variant="ghost"
            color="red"
            size="1"
            aria-label="Delete template"
            title="Delete template"
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 size={20} />
          </IconButton>
        </Flex>
      </Flex>

      <ConfirmDeleteDialog
        open={confirmOpen}
        templateName={template.name}
        onOpenChange={setConfirmOpen}
        onConfirm={() => onDelete(template.id)}
      />
    </>
  );
}
