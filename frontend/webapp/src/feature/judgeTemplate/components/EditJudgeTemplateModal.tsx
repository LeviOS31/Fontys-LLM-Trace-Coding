import { Button, Dialog, Flex, Text, TextArea, TextField } from '@radix-ui/themes';
import { useState } from 'react';
import { Download, TriangleAlert, X } from 'lucide-react';
import type { JudgeTemplate } from '../../../shared/types/judgeTemplate.ts';
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog.tsx';

interface Props {
  template: JudgeTemplate;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export function EditJudgeTemplateModal({ template, onClose, onDelete }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Content maxWidth="720px" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Header */}
        <Flex
          align="start"
          justify="between"
          gap="3"
          style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--gray-4)' }}
        >
          <Dialog.Title size="5" style={{ marginTop: 6 }}>
            Judge Template
          </Dialog.Title>
          <Dialog.Close
            aria-label="Close"
            style={{
              width: 32,
              height: 32,
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              cursor: 'pointer',
              color: 'var(--gray-9)',
              flexShrink: 0,
            }}
          >
            <X size={14} />
          </Dialog.Close>
        </Flex>

        {/* Body */}
        <Flex
          direction="column"
          gap="4"
          style={{ padding: '18px 22px', overflowY: 'auto', maxHeight: 'calc(80vh - 130px)' }}
        >
          {template.isDeprecated && (
            <Flex
              align="start"
              gap="2"
              style={{
                padding: '10px 12px',
                background: 'var(--amber-2)',
                border: '1px solid var(--amber-6)',
                borderRadius: 'var(--radius-3)',
                color: 'var(--amber-11)',
              }}
            >
              <TriangleAlert size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <Text size="2" style={{ lineHeight: 1.5 }}>
                <strong>Heads up. </strong>
                This template is not synced with its axial code. Review and update the instructions.
              </Text>
            </Flex>
          )}

          <Flex direction="column" gap="1">
            <Text size="2" weight="bold">
              Name
            </Text>
            <TextField.Root value={template.name} readOnly />
          </Flex>

          <Flex direction="column" gap="1">
            <Text size="2" weight="bold">
              Description
            </Text>
            <TextArea value={template.description} readOnly rows={2} style={{ resize: 'none' }} />
          </Flex>

          <Flex direction="column" gap="1">
            <Text size="2" weight="bold">
              Judge instructions
            </Text>
            <TextArea
              value={template.template}
              readOnly
              rows={14}
              style={{
                resize: 'vertical',
                fontFamily: 'var(--code-font-family)',
                background: 'var(--gray-a2)',
              }}
            />
          </Flex>
        </Flex>

        {/* Footer */}
        <Flex
          align="center"
          justify="between"
          gap="2"
          style={{
            padding: '14px 22px',
            borderTop: '1px solid var(--gray-4)',
            background: 'var(--gray-2)',
          }}
        >
          <Button variant="outline" color="red" onClick={() => setConfirmOpen(true)}>
            Delete Template
          </Button>
          <ConfirmDeleteDialog
            open={confirmOpen}
            templateName={template.name}
            onOpenChange={setConfirmOpen}
            onConfirm={() => onDelete(template.id)}
          />
          <Flex gap="2" ml="auto">
            <Button
              variant="soft"
              color="gray"
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
              <Download size={14} />
              Download
            </Button>
            <Button variant="soft" color="gray" onClick={onClose}>
              Close
            </Button>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
