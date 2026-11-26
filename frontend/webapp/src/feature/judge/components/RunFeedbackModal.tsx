import { useState } from 'react';
import { Button, Dialog, Flex, Text, TextArea } from '@radix-ui/themes';

type Props = {
  readonly title: string;
  readonly initial: string;
  readonly onSave: (text: string) => Promise<boolean>;
  readonly onClose: () => void;
};

export default function RunFeedbackModal({ title, initial, onSave, onClose }: Props) {
  const [text, setText] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const save = async () => {
    setSaving(true);
    setFailed(false);
    const ok = await onSave(text.trim());
    setSaving(false);
    if (ok) onClose();
    else setFailed(true);
  };

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !saving) onClose();
      }}
    >
      <Dialog.Content maxWidth="520px">
        <Dialog.Title>Feedback</Dialog.Title>
        <Dialog.Description size="2" color="gray">
          How did “{title}” behave? What is good/bad in the template?
        </Dialog.Description>
        <TextArea
          mt="3"
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. Too strict on refusals that include an apology…"
        />
        {failed && (
          <Text as="p" size="2" color="red" role="alert" mt="2">
            Could not save feedback. Please try again.
          </Text>
        )}
        <Flex gap="3" mt="4" justify="end">
          <Button variant="soft" color="gray" disabled={saving} onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={saving || text.trim() === initial.trim()} onClick={save}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}