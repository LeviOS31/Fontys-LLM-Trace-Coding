import { AlertDialog, Button, Flex } from '@radix-ui/themes';

interface Props {
  readonly open: boolean;
  readonly templateName: string;
  readonly onOpenChange: (open: boolean) => void;
  readonly onConfirm: () => void;
}

export function ConfirmDeleteDialog({ open, templateName, onOpenChange, onConfirm }: Props) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Content maxWidth="420px">
        <AlertDialog.Title>Delete judge template</AlertDialog.Title>
        <AlertDialog.Description size="2" color="gray">
          Are you sure you want to delete <strong>{templateName}</strong>? This action cannot be
          undone.
        </AlertDialog.Description>
        <Flex gap="3" mt="4" justify="end">
          <AlertDialog.Cancel>
            <Button variant="soft" color="gray">
              Cancel
            </Button>
          </AlertDialog.Cancel>
          <AlertDialog.Action>
            <Button variant="solid" color="red" onClick={onConfirm}>
              Delete
            </Button>
          </AlertDialog.Action>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}
