import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';
import { Box, Flex, TextArea, Text, Badge } from '@radix-ui/themes';
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
  // Track whether the current value has been successfully saved locally,
  // so we don't show a stale "Saved" badge when switching traces.
  const [localSaved, setLocalSaved] = useState(false);

  // Reset local state whenever the selected trace changes.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpenCode(savedOpencode);
    setLocalSaved(false);
  }, [traceId]); // eslint-disable-line react-hooks/exhaustive-deps

  const isDirty = openCode !== savedOpencode;

  // Debounced auto-save — keyed on openCode, not isDirty.
  useEffect(() => {
    if (!isDirty || !traceId) return;

    const timeout = setTimeout(() => {
      mutate({ traceId, openCode }, { onSuccess: () => setLocalSaved(true) });
    }, 500);

    return () => clearTimeout(timeout);
  }, [openCode, traceId, isDirty, mutate]);

  // Clear the localSaved flag as soon as the user starts typing again.
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalSaved(false);
    setOpenCode(e.target.value);
  };

  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  // Arrow keys leave the textarea so the global navigation shortcuts take
  // over. Blurring here happens before the global keydown listeners run, so
  // the same keystroke already triggers the group/trace navigation.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  // ─── Keyboard shortcuts ───────────────────────────────────────────────────
  // O → Focus the open code textarea
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (isTyping()) return;
      if (e.key.toLowerCase() !== 'o') return;

      const textArea = textAreaRef.current;
      if (!textArea) return;

      e.preventDefault();
      textArea.focus();
      // Place the caret at the end of the existing open code.
      textArea.setSelectionRange(textArea.value.length, textArea.value.length);
    };

    globalThis.addEventListener('keydown', handleKey);
    return () => globalThis.removeEventListener('keydown', handleKey);
  }, []);

  if (!selectedTrace) {
    return (
      <Flex align="center" justify="center" style={{ height: '100%' }}>
        <Text size="2" color="gray">
          Select a trace to open code
        </Text>
      </Flex>
    );
  }

  return (
    <Flex
      direction="column"
      gap="3"
      style={{ height: '100%', padding: '16px 12px', boxSizing: 'border-box' }}
    >
      {/* Header */}
      <Flex align="center" justify="between" style={{ flexShrink: 0 }}>
        <Text
          size="1"
          weight="bold"
          color="gray"
          style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}
        >
          Open Code
        </Text>
        <Box>
          {isPending && (
            <Badge color="gray" size="1" variant="soft">
              Saving…
            </Badge>
          )}
          {!isPending && isDirty && !localSaved && (
            <Badge color="red" size="1" variant="soft">
              Unsaved changes
            </Badge>
          )}
          {!isPending && !isDirty && localSaved && (
            <Badge color="green" size="1" variant="soft">
              Saved
            </Badge>
          )}
        </Box>
      </Flex>

      {/* Textarea */}
      <Box>
        <TextArea
          ref={textAreaRef}
          placeholder="Add open code for this trace…"
          size="2"
          value={openCode}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          style={{ minHeight: '12em' }}
        />
      </Box>
    </Flex>
  );
}
