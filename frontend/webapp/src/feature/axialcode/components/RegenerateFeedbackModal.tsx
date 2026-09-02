import { useState } from 'react';
import { Button, Dialog, Flex, TextArea } from '@radix-ui/themes';
import { RefreshCw, Sparkles } from 'lucide-react';
import { colors } from '../../../shared/styling/colors.ts';
import '../AxialCodePage.module.css';

interface RegenerateFeedbackModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onRegenerate: (feedback: string | null) => void;
  readonly isPending: boolean;
}

export default function RegenerateFeedbackModal({
  open,
  onOpenChange,
  onRegenerate,
  isPending,
}: RegenerateFeedbackModalProps) {
  const [feedback, setFeedback] = useState('');

  const handleOpenChange = (next: boolean) => {
    if (!next) setFeedback('');
    onOpenChange(next);
  };

  const handleSubmit = () => {
    const normalized = feedback.trim().length > 0 ? feedback : null;
    onRegenerate(normalized);
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Content maxWidth="520px">
        <Dialog.Title>Regenerate axial codes</Dialog.Title>
        <Dialog.Description size="2" color="gray" mb="4">
          Optionally provide feedback to guide the next generation. Leave blank to regenerate
          completely.
        </Dialog.Description>

        <TextArea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="E.g. 'Split the largest category into two' or 'Merge codes X and Y into one'…"
          size="2"
          rows={7}
          disabled={isPending}
        />

        <Flex gap="2" mt="4" justify="end">
          <Button variant="soft" color="gray" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button color={colors.theme.radix.primary} onClick={handleSubmit} disabled={isPending}>
            {isPending ? <RefreshCw size={14} className="ai-icon-spin" /> : <Sparkles size={14} />}
            {isPending ? 'Working…' : 'Regenerate'}
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
