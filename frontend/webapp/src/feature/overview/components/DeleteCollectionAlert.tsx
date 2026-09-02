import { AlertDialog, Button, Callout, Flex, Spinner, Text, TextField } from '@radix-ui/themes';
import { Info } from 'lucide-react';
import { useMemo, useState } from 'react';

type DeleteCollectionAlertProps = {
  collectionName: string;
  onDelete: () => void;
  isPending: boolean;
  isError: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};

export function DeleteCollectionAlert({
  collectionName,
  onDelete,
  isPending,
  isError,
  isOpen,
  setIsOpen,
}: Readonly<DeleteCollectionAlertProps>) {
  const [confirmationName, setConfirmationName] = useState('');
  const [touched, setTouched] = useState(false);

  const trimmedCollectionName = useMemo(() => collectionName.trim(), [collectionName]);
  const isNameMatch = confirmationName.trim() === trimmedCollectionName;

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setConfirmationName('');
      setTouched(false);
    }

    setIsOpen(open);
  };

  const showMismatch = touched && confirmationName.trim().length > 0 && !isNameMatch;

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <AlertDialog.Root open={isOpen} onOpenChange={handleOpenChange}>
        <AlertDialog.Trigger>
          <Button
            variant="solid"
            color="red"
            disabled={isPending}
            onClick={(e) => e.stopPropagation()}
          >
            Delete
          </Button>
        </AlertDialog.Trigger>
        <AlertDialog.Content maxWidth="450px" onClick={(e) => e.stopPropagation()}>
          <AlertDialog.Title>Delete the Trace Collection</AlertDialog.Title>
          <AlertDialog.Description size="2">
            This will permanently remove the Trace Collection and all its data. This action cannot
            be undone.
          </AlertDialog.Description>

          <Flex direction="column" gap="1" mt="3">
            <Text
              as="label"
              size="2"
              weight="medium"
              htmlFor="trace-collection-delete-confirmation"
            >
              Type <Text weight="bold">{trimmedCollectionName}</Text> to confirm
            </Text>
            <TextField.Root
              id="trace-collection-delete-confirmation"
              value={confirmationName}
              onChange={(e) => {
                setConfirmationName(e.target.value);
                setTouched(true);
              }}
              onBlur={() => setTouched(true)}
              placeholder="Collection name"
              autoComplete="off"
              disabled={isPending}
            />
            <Text size="1" color={showMismatch ? 'red' : 'gray'}>
              {showMismatch
                ? 'Collection name does not match.'
                : 'Delete is enabled only after an exact match.'}
            </Text>
          </Flex>

          {isPending && (
            <Callout.Root color="blue" size="1" mt="3">
              <Callout.Icon>
                <Spinner />
              </Callout.Icon>
              <Callout.Text>
                Deletion in progress. This may take a moment as all associated data is being
                removed...
              </Callout.Text>
            </Callout.Root>
          )}

          {isError && (
            <Callout.Root color="red" size="1" mt="3">
              <Callout.Icon>
                <Info />
              </Callout.Icon>
              <Callout.Text>Deleting the Collection failed. Please try again.</Callout.Text>
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
              Delete Collection
            </Button>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </div>
  );
}
