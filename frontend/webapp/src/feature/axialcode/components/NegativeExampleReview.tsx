import { useCallback, useEffect, useRef, useState } from 'react';
import { Badge, Box, Button, Card, Dialog, Flex, Heading, Text, TextArea } from '@radix-ui/themes';
import { generateNegativeExampleDraft } from '../../../shared/api/axialCode';
import type { AxialCode } from '../../../shared/types/axialCode';
import AxialCodeExampleConversation from './AxialCodeExampleConversation';

type Props = {
  readonly projectId: string;
  readonly projectVersionId: string;
  readonly axialCodes: AxialCode[];
  readonly isSaving: boolean;
  readonly saveError?: string | null;
  readonly onComplete: (axialCodes: AxialCode[]) => void;
};

type ExampleDraft = {
  readonly source: 'real' | 'generated';
  readonly trace: string;
  readonly reasoning: string;
};

export default function NegativeExampleReview({
  projectId,
  projectVersionId,
  axialCodes,
  isSaving,
  saveError,
  onComplete,
}: Props) {
  const [reviewedCodes, setReviewedCodes] = useState(axialCodes);
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState<ExampleDraft | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const requestedIndices = useRef(new Set<number>());
  const code = reviewedCodes[index];

  const generateDraft = useCallback(
    async (codeIndex: number, axialCode: AxialCode) => {
      if (requestedIndices.current.has(codeIndex)) return;
      requestedIndices.current.add(codeIndex);
      setDraft(null);
      setGenerationError(null);
      setIsEditing(false);
      setIsGenerating(true);
      try {
        const generated = await generateNegativeExampleDraft(projectId, projectVersionId, {
          label: axialCode.label,
          description: axialCode.description,
          judgeGuidelines: axialCode.judgeGuidelines ?? '',
          positiveExampleTrace: axialCode.positiveExampleTrace,
        });
        setDraft({ source: 'generated', ...generated });
      } catch (error) {
        requestedIndices.current.delete(codeIndex);
        setGenerationError(error instanceof Error ? error.message : String(error));
      } finally {
        setIsGenerating(false);
      }
    },
    [projectId, projectVersionId]
  );

  useEffect(() => {
    if (!code) return;
    setGenerationError(null);
    if (code.negativeExampleTrace) {
      setDraft({ source: 'real', trace: code.negativeExampleTrace, reasoning: '' });
      setIsEditing(false);
      return;
    }

    void generateDraft(index, code);
  }, [code, generateDraft, index]);

  if (!code) return null;

  const acceptExample = () => {
    if (!draft || !draft.trace.trim() || !draft.reasoning.trim() || isSaving) return;
    const updatedCodes = reviewedCodes.map((item, itemIndex) =>
      itemIndex === index
        ? {
            ...item,
            negativeExampleTrace: draft.trace.trim(),
            negativeExampleReasoning: draft.reasoning.trim(),
          }
        : item
    );
    setReviewedCodes(updatedCodes);
    if (index === reviewedCodes.length - 1) {
      onComplete(updatedCodes);
    } else {
      setIndex(index + 1);
    }
  };

  return (
    <Dialog.Root open onOpenChange={() => undefined}>
      <Dialog.Content
        maxWidth="760px"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
      >
        <Flex direction="column" gap="4">
          <Box>
            <Dialog.Title>Approve a negative example</Dialog.Title>
            <Dialog.Description size="2" color="gray" mt="1">
              Confirm that this example does not show the behavior. You must approve one for each
              axial code before continuing.
            </Dialog.Description>
          </Box>

          <Card
            size="1"
            style={{
              background: 'var(--red-2)',
              border: '1px solid var(--red-6)',
              borderRadius: 'var(--radius-3)',
            }}
          >
            <Flex gap="3" align="stretch">
              <Box
                style={{
                  width: 3,
                  background: 'var(--red-9)',
                  borderRadius: 2,
                  flexShrink: 0,
                }}
              />
              <Flex direction="column" gap="2" style={{ minWidth: 0 }}>
                <Flex align="center" gap="2" wrap="wrap">
                  <Heading size="4">{code.label}</Heading>
                  <Badge color="red" variant="soft">
                    Negative example · {index + 1} of {reviewedCodes.length}
                  </Badge>
                </Flex>
                <Text size="2" style={{ lineHeight: 1.5 }}>
                  {code.description}
                </Text>
              </Flex>
            </Flex>
          </Card>

          {code.positiveExampleTrace && (
            <Card
              size="1"
              style={{
                background: 'var(--green-2)',
                border: '1px solid var(--green-6)',
                borderRadius: 'var(--radius-3)',
              }}
            >
              <Flex direction="column" gap="2">
                <Badge color="green" variant="soft" style={{ alignSelf: 'start' }}>
                  Positive example · demonstrates the behavior
                </Badge>
                <AxialCodeExampleConversation trace={code.positiveExampleTrace} />
              </Flex>
            </Card>
          )}

          {isGenerating ? (
            <Text role="status">Creating a counterexample draft…</Text>
          ) : generationError ? (
            <Flex direction="column" gap="2">
              <Text role="alert" color="red">
                Could not generate a counterexample: {generationError}
              </Text>
              <Button
                type="button"
                variant="outline"
                onClick={() => void generateDraft(index, code)}
              >
                Try again
              </Button>
            </Flex>
          ) : draft ? (
            <Card
              size="1"
              style={{
                background: 'var(--red-1)',
                border: '1px solid var(--red-6)',
                borderRadius: 'var(--radius-3)',
              }}
            >
              <Flex direction="column" gap="3">
                <Flex direction="column" gap="1">
                  <Text size="2" weight="bold">
                    {draft.source === 'real' ? 'Suggested real trace' : 'Generated example draft'}
                  </Text>
                  <Text size="1" color="gray">
                    {draft.source === 'real'
                      ? 'Is this relevant to the code, but missing the behavior? If not, reject it to create a replacement.'
                      : 'Review this draft. It should be relevant to the code but clearly lack the behavior.'}
                  </Text>
                </Flex>

                {draft.source === 'generated' && (
                  <Flex justify="end">
                    <Button
                      type="button"
                      size="1"
                      variant="soft"
                      color="gray"
                      onClick={() => setIsEditing((editing) => !editing)}
                    >
                      {isEditing ? 'Hide editor' : 'Edit generated example'}
                    </Button>
                  </Flex>
                )}
                {isEditing && draft.source === 'generated' && (
                  <TextArea
                    aria-label="Edit negative example"
                    value={draft.trace}
                    onChange={(event) => setDraft({ ...draft, trace: event.target.value })}
                    rows={6}
                    maxLength={1100}
                  />
                )}
                <AxialCodeExampleConversation trace={draft.trace} />

                <Box>
                  <Text as="div" size="2" weight="bold" mb="1">
                    Why does this not show the behavior?
                  </Text>
                  <TextArea
                    aria-label="Negative example reasoning"
                    value={draft.reasoning}
                    onChange={(event) => setDraft({ ...draft, reasoning: event.target.value })}
                    rows={3}
                    maxLength={1000}
                  />
                </Box>
              </Flex>
            </Card>
          ) : null}

          {saveError && (
            <Text role="alert" color="red">
              {saveError}
            </Text>
          )}
          {isSaving && <Text role="status">Saving reviewed axial codes…</Text>}

          <Flex gap="2" justify="end">
            {draft?.source === 'real' && (
              <Button
                type="button"
                variant="soft"
                color="red"
                disabled={isGenerating || isSaving}
                onClick={() => void generateDraft(index, code)}
              >
                Reject trace and generate replacement
              </Button>
            )}
            {draft && (
              <Button
                type="button"
                color="green"
                onClick={acceptExample}
                disabled={!draft.trace.trim() || !draft.reasoning.trim() || isSaving}
              >
                {isSaving
                  ? 'Saving…'
                  : index === reviewedCodes.length - 1
                    ? 'Approve example and finish'
                    : 'Approve example and continue'}
              </Button>
            )}
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
