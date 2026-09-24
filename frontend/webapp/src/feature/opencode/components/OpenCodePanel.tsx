import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';
import { Plus, SquarePen, Trash, X } from 'lucide-react';
import { Box, Button, Flex, TextArea, Text, Badge } from '@radix-ui/themes';
import type { TraceDetailView } from '../../../shared/types/trace.ts';
import { isTyping } from '../../../shared/util/shortcutHelpers.ts';
import { useAddOpencode } from '../hooks/useAddOpencode.ts';

interface Props {
  readonly selectedTrace?: TraceDetailView;
  readonly projectId: string;
  readonly versionId: string;
}

export default function OpenCodePanel({ selectedTrace, projectId, versionId }: Props) {
  const { traceGroupId } = useParams();
  const traceId = selectedTrace?.traceId ?? '';

  const { mutate, isPending } = useAddOpencode(projectId, versionId, traceGroupId ?? '');

  const savedOpencode = selectedTrace?.openCode ?? '';

  const [openCode, setOpenCode] = useState(savedOpencode);
  const [isEditing, setIsEditing] = useState(false);

  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  // Reset the editor whenever the selected trace changes.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpenCode(savedOpencode);
    setIsEditing(false);
  }, [traceId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStartEditing = () => {
    setOpenCode(savedOpencode);
    setIsEditing(true);

    requestAnimationFrame(() => {
      const textArea = textAreaRef.current;

      if (!textArea) return;

      textArea.focus();
      textArea.setSelectionRange(textArea.value.length, textArea.value.length);
    });
  };

  const handleCancel = () => {
    setOpenCode(savedOpencode);
    setIsEditing(false);
  };

  const handleSave = () => {
    if (!traceId) return;

    mutate(
      {
        traceId,
        openCode,
      },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      }
    );
  };

  const handleDelete = () => {
    if (!traceId) return;

    mutate(
      {
        traceId,
        openCode: '',
      },
      {
        onSuccess: () => {
          setOpenCode('');
          setIsEditing(false);
        },
      }
    );
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setOpenCode(e.target.value);
  };

  // Arrow keys leave the textarea so the global navigation shortcuts take
  // over. Blurring here happens before the global keydown listeners run, so
  // the same keystroke already triggers the group/trace navigation.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      e.currentTarget.blur();
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();

      if (!openCode.trim() || isPending) return;

      handleSave();
    }
  };

  // O → Focus the open code textarea while editing.
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (isTyping()) return;
      if (e.key.toLowerCase() !== 'o') return;
      if (!isEditing) return;

      const textArea = textAreaRef.current;
      if (!textArea) return;

      e.preventDefault();
      textArea.focus();
      textArea.setSelectionRange(textArea.value.length, textArea.value.length);
    };

    globalThis.addEventListener('keydown', handleKey);
    return () => globalThis.removeEventListener('keydown', handleKey);
  }, [isEditing]);

  if (!selectedTrace) {
    return (
      <Flex align="center" justify="center" style={{ height: '100%' }}>
        <Text size="2" color="gray">
          Select a trace to open code
        </Text>
      </Flex>
    );
  }

  const hasOpenCode = savedOpencode.trim().length > 0;

  return (
    <Flex
      direction="column"
      gap="3"
      style={{
        height: '100%',
        minWidth: 0,
        overflow: 'hidden',
        padding: '16px 12px',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <Flex align="center" justify="between" style={{ flexShrink: 0, minWidth: 0 }}>
        <Text
          size="1"
          weight="bold"
          color="gray"
          style={{
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            minWidth: 0,
          }}
        >
          Open Code
        </Text>

        {isEditing && (
          <Badge color="orange" size="1" variant="soft">
            Editing
          </Badge>
        )}
      </Flex>

      {/* Existing open code */}
      {hasOpenCode && !isEditing && (
        <>
          <Box
            style={{
              flex: 1,
              minHeight: 0,
              minWidth: 0,
              overflow: 'auto',
              padding: '8px 10px',
              border: '1px solid var(--gray-a6)',
              borderRadius: '6px',
              backgroundColor: 'var(--gray-a2)',
              whiteSpace: 'pre-wrap',
              overflowWrap: 'break-word',
            }}
          >
            <Text size="2">{savedOpencode}</Text>
          </Box>

          <Flex justify="end" gap="2" style={{ flexShrink: 0, width: '100%' }}>
            <Button
              variant="soft"
              color="red"
              onClick={handleDelete}
              disabled={isPending}
              style={{ flex: 1 }}
            >
              Delete <Trash size={15} color="var(--red-9)" style={{ flexShrink: 0 }} />
            </Button>

            <Button
              variant="soft"
              onClick={handleStartEditing}
              disabled={isPending}
              style={{ flex: 1 }}
            >
              Edit <SquarePen size={15} color="var(--green-9)" style={{ flexShrink: 0 }} />
            </Button>
          </Flex>
        </>
      )}

      {/* Add open code */}
      {!hasOpenCode && !isEditing && (
        <>
          <Box
            style={{
              flex: 1,
              minHeight: 0,
              minWidth: 0,
              overflow: 'hidden',
            }}
          >
            <TextArea
              ref={textAreaRef}
              placeholder="Add open code for this trace…"
              size="2"
              value={openCode}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              style={{
                minHeight: '12em',
                height: '100%',
              }}
            />
          </Box>

          <Flex justify="end" gap="2" style={{ flexShrink: 0, width: '100%' }}>
            <Button
              variant="soft"
              color="gray"
              onClick={handleCancel}
              disabled={isPending}
              style={{ flex: 1 }}
            >
              Cancel <X size={15} color="var(--red-9)" style={{ flexShrink: 0 }} />
            </Button>

            <Button
              onClick={handleSave}
              disabled={isPending || !openCode.trim()}
              style={{ flex: 1 }}
            >
              {isPending ? (
                'Adding…'
              ) : (
                <Flex align="center" justify="center" gap="1">
                  Add
                  <Plus
                    size={15}
                    color={openCode.trim() ? 'white' : 'var(--green-9)'}
                    style={{ flexShrink: 0 }}
                  />
                </Flex>
              )}
            </Button>
          </Flex>
        </>
      )}

      {/* Edit existing open code */}
      {hasOpenCode && isEditing && (
        <>
          <Box
            style={{
              flex: 1,
              minHeight: 0,
              minWidth: 0,
              overflow: 'hidden',
            }}
          >
            <TextArea
              ref={textAreaRef}
              placeholder="Add open code for this trace…"
              size="2"
              value={openCode}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              style={{
                minHeight: '12em',
                height: '100%',
              }}
            />
          </Box>

          <Flex justify="end" gap="2" style={{ flexShrink: 0, width: '100%' }}>
            <Button
              variant="soft"
              color="gray"
              onClick={handleCancel}
              disabled={isPending}
              style={{ flex: 1 }}
            >
              Cancel <X size={15} color="var(--red-9)" style={{ flexShrink: 0 }} />
            </Button>

            <Button
              onClick={handleSave}
              disabled={isPending || !openCode.trim()}
              style={{ flex: 1 }}
            >
              {isPending ? (
                'Saving...'
              ) : (
                <Flex align="center" justify="center" gap="1">
                  Save
                  <Plus
                    size={15}
                    color={openCode.trim() ? 'white' : 'var(--green-9)'}
                    style={{ flexShrink: 0 }}
                  />
                </Flex>
              )}
            </Button>
          </Flex>
        </>
      )}
    </Flex>
  );
}
