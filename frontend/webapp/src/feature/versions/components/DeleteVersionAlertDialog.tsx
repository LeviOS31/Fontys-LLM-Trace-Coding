import { AlertDialog, Button, Callout, Flex, Spinner, Text, TextField } from '@radix-ui/themes';
import { Info } from 'lucide-react';
import { useMemo, useState } from 'react';

type DeleteVersionAlertDialogProps = {
  versionName: string;
  onDelete: () => void;
  isPending: boolean;
  isError: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};

export function DeleteVersionAlertDialog({
  versionName,
  onDelete,
  isPending,
  isError,
  isOpen,
  setIsOpen,
}: Readonly<DeleteVersionAlertDialogProps>) {
  const [confirmationName, setConfirmationName] = useState('');
  const [touched, setTouched] = useState(false);

  const trimmedVersionName = useMemo(() => versionName.trim(), [versionName]);
  const isNameMatch = confirmationName.trim() === trimmedVersionName;

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setConfirmationName('');
      setTouched(false);
    }

    setIsOpen(open);
  };

  const showMismatch = touched && confirmationName.trim().length > 0 && !isNameMatch;

  return (
    <AlertDialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialog.Trigger>
        <Button variant="solid" color="red" disabled={isPending}>
          Delete
        </Button>
      </AlertDialog.Trigger>
      <AlertDialog.Content maxWidth="450px">
        <AlertDialog.Title>Delete the version</AlertDialog.Title>
        <AlertDialog.Description size="2">
          This will permanently remove this version. This action cannot be undone.
        </AlertDialog.Description>

        <Flex direction="column" gap="1" mt="3">
          <Text as="label" size="2" weight="medium" htmlFor="version-delete-confirmation">
            Type <Text weight="bold">{trimmedVersionName}</Text> to confirm
          </Text>
          <TextField.Root
            id="version-delete-confirmation"
            value={confirmationName}
            onChange={(e) => {
              setConfirmationName(e.target.value);
              setTouched(true);
            }}
            onBlur={() => setTouched(true)}
            placeholder="Version name"
            autoComplete="off"
            disabled={isPending}
          />
          <Text size="1" color={showMismatch ? 'red' : 'gray'}>
            {showMismatch
              ? 'Version name does not match.'
              : 'Delete is enabled only after an exact match.'}
          </Text>
        </Flex>

        {isPending && (
          <Callout.Root color="blue" size="1" mt="3">
            <Callout.Icon>
              <Spinner />
            </Callout.Icon>
            <Callout.Text>
              Deletion in progress. This may take a moment as all associated traces are being
              removed...
            </Callout.Text>
          </Callout.Root>
        )}

        {isError && (
          <Callout.Root color="red" size="1" mt="3">
            <Callout.Icon>
              <Info />
            </Callout.Icon>
            <Callout.Text>Deleting the version failed. Please try again.</Callout.Text>
          </Callout.Root>
        )}

        <Flex gap="3" mt="4" justify="end">
          <AlertDialog.Cancel>
            <Button variant="soft" color="gray" disabled={isPending}>
              Cancel
            </Button>
          </AlertDialog.Cancel>

          <Button
            variant="solid"
            color="red"
            onClick={onDelete}
            disabled={isPending || !isNameMatch}
            style={{
              minWidth: isPending ? '140px' : undefined,
            }}
          >
            Delete version
          </Button>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}
