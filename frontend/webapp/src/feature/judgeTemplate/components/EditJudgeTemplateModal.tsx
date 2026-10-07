import { Badge, Button, Dialog, Flex, IconButton, Separator, Text, TextArea, TextField, Tooltip } from '@radix-ui/themes';
import { useEffect, useState } from 'react';
import { Download, History, RotateCcw, Save, Scale, Trash2, TriangleAlert, X } from 'lucide-react';
import type { JudgeTemplate } from '../../../shared/types/judgeTemplate.ts';
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog.tsx';
import { useGetJudgeTemplateVersions } from '../hooks/useGetJudgeTemplateVersions.ts';
import { useDeleteJudgeTemplateVersion } from '../hooks/useDeleteJudgeTemplateVersion.ts';

interface Props {
  template: JudgeTemplate;
  projectId: string;
  projectVersionId: string;
  onClose: () => void;
  onDelete: (id: string) => void;
  onSave: (id: string, content: string) => void;
  onRestore: (id: string, versionNumber: number) => void;
  isSaving: boolean;
  isRestoring: boolean;
}

export function EditJudgeTemplateModal({
  template,
  projectId,
  projectVersionId,
  onClose,
  onDelete,
  onSave,
  onRestore,
  isSaving,
  isRestoring,
}: Props) {
  const { data: versionsData } = useGetJudgeTemplateVersions(
    projectId,
    projectVersionId,
    template.id,
    true
  );
  const versions = versionsData?.versions ?? [];

  const { mutate: deleteVersion, isPending: isDeletingVersion } = useDeleteJudgeTemplateVersion(
    projectId,
    projectVersionId
  );

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [content, setContent] = useState(template.template);

  useEffect(() => {
    setContent(template.template);
  }, [template.template]);

  const isDirty = content !== template.template;

  // "Current" is whatever the backend says is active, not just the highest
  // version number ever created — restoring an older version makes IT current.
  const currentVersionNumber = template.currentVersionNumber;

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Content maxWidth="720px" style={{ padding: 0, overflow: 'hidden' }} aria-describedby={undefined}>
        {/* Header */}
        <Flex
          align="center"
          justify="between"
          gap="3"
          style={{ padding: '16px 22px', borderBottom: '1px solid var(--gray-4)' }}
        >
          <Flex align="center" gap="2">
            <Scale size={17} style={{ color: 'var(--gray-11)' }} />
            <Dialog.Title size="4" mb="0">
              Judge Template
            </Dialog.Title>
            {currentVersionNumber && (
              <Badge variant="soft" color="gray" radius="full">
                v{currentVersionNumber}
              </Badge>
            )}
          </Flex>
              <Button variant="ghost" color="gray" size="2" onClick={onClose}>
                <X size={15} />
              </Button>
          </Flex>

        {/* Body */}
        <Flex direction="column" gap="4" style={{ padding: '20px 22px', maxHeight: '2000px' }}>
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

          <Flex gap="4">
            <Flex direction="column" gap="1" style={{ flex: 1 }}>
              <Text size="1" weight="medium" color="gray" style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Name
              </Text>
              <TextField.Root value={template.name} readOnly variant="soft" />
            </Flex>
          </Flex>

          <Flex direction="column" gap="1">
            <Text size="1" weight="medium" color="gray" style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Description
            </Text>
            <TextArea value={template.description} readOnly rows={2} variant="soft" style={{ resize: 'none' }} />
          </Flex>

          <Separator size="4" />

          <Flex direction="column" gap="1">
            <Text size="1" weight="medium" color="gray" style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Judge instructions
            </Text>
            <TextArea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={14}
              style={{
                resize: 'vertical',
                fontFamily: 'var(--code-font-family)',
                fontSize: 12.5,
                lineHeight: 1.6,
                background: 'var(--gray-a2)',
                border: '1px solid var(--gray-a5)',
              }}
            />
          </Flex>

          {versions.length > 0 && (
            <>
              <Separator size="4" />
              <Flex direction="column" gap="2">
                <Flex align="center" gap="2">
                  <History size={14} style={{ color: 'var(--gray-10)' }} />
                  <Text size="1" weight="medium" color="gray" style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Version history
                  </Text>
                </Flex>
                <Flex
                  direction="column"
                  style={{
                    border: '1px solid var(--gray-a5)',
                    borderRadius: 'var(--radius-3)',
                    maxHeight: 160,
                    overflowY: 'auto',
                    background: 'var(--color-panel)',
                  }}
                >
                  {versions.map((v, i) => {
                    const isCurrent = v.versionNumber === currentVersionNumber;
                    return (
                      <Flex
                        key={v.versionNumber}
                        align="center"
                        justify="between"
                        px="3"
                        py="2"
                        style={{
                          borderBottom: i < versions.length - 1 ? '1px solid var(--gray-a4)' : undefined,
                        }}
                      >
                        <Flex align="center" gap="4">
                          <Badge variant={isCurrent ? 'solid' : 'soft'} color={isCurrent ? 'jade' : 'gray'} radius="full">
                            v{v.versionNumber}
                          </Badge>
                          <Text size="1" color="gray">
                            {new Date(v.createdAt).toLocaleString()}
                          </Text>
                        </Flex>
                        <Flex align="center" gap="3">
                          {!isCurrent && (
                            <>
                              <Tooltip content="Make this the current version" side="right" sideOffset={6}>
                                <Button
                                  size="2"
                                  variant="ghost"
                                  color="gray"
                                  disabled={isRestoring}
                                  onClick={() => onRestore(template.id, v.versionNumber)}
                                >
                                  <RotateCcw size={15} />
                                  Restore
                                </Button>
                              </Tooltip>

                              <IconButton
                                size="1"
                                variant="ghost"
                                color="red"
                                disabled={isDeletingVersion}
                                onClick={() =>
                                  deleteVersion({
                                    judgeTemplateId: template.id,
                                    versionNumber: v.versionNumber,
                                  })
                                }
                              >
                                <Trash2 size={15} />
                              </IconButton>
                            </>
                          )}
                        </Flex>
                      </Flex>
                    );
                  })}
                </Flex>
              </Flex>
            </>
          )}
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
          <Button variant="soft" color="red" onClick={() => setConfirmOpen(true)}>
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
            <Button variant="solid" disabled={!isDirty || isSaving} onClick={() => onSave(template.id, content)}>
              <Save size={14} />
              {isSaving ? 'Saving…' : 'Save'}
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