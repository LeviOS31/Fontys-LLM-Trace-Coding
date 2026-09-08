import { Button, Callout, Flex, Spinner, Text, TextField, Tooltip } from '@radix-ui/themes';
import { Info } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import Modal from '../../../shared/components/Modal.tsx';
import { useEditTraceCollection } from '../hooks/useEditTraceCollection.ts';
import { DeleteCollectionAlert } from './DeleteCollectionAlert.tsx';
import { useDeleteCollection } from '../hooks/useDeleteCollection.ts';
import { isTyping } from '../../../shared/util/shortcutHelpers.ts';

type EditTraceCollectionModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectVersionId: string;
  collectionId: string;
  collectionName: string;
};

export function EditTraceCollectionModal({
  open,
  onOpenChange,
  projectId,
  projectVersionId,
  collectionId,
  collectionName,
}: Readonly<EditTraceCollectionModalProps>) {
  const [nameOverride, setNameOverride] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const {
    mutate: editCollection,
    isPending: isEditPending,
    isError: isEditError,
    reset: resetEdit,
  } = useEditTraceCollection();

  const {
    mutate: deleteCollection,
    isPending: isDeletePending,
    isError: isDeleteError,
  } = useDeleteCollection();

  const name = nameOverride ?? collectionName;
  const trimmedName = name.trim();
  const isBusy = isEditPending || isDeletePending;
  const hasChanges = trimmedName !== collectionName.trim();
  const canSave = trimmedName.length > 0 && hasChanges && !isBusy;

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        setNameOverride(null);
        setDeleteDialogOpen(false);
        resetEdit();
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange, resetEdit]
  );

  const handleSubmit = () => {
    if (!canSave) return;
    editCollection(
      { projectId, projectVersionId, collectionId, name: trimmedName },
      { onSuccess: () => handleOpenChange(false) }
    );
  };

  const handleDelete = () => {
    deleteCollection(
      { projectId, projectVersionId, collectionId },
      {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          handleOpenChange(false);
        },
      }
    );
  };

  // ─── Keyboard shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;

    const handleKey = (e: KeyboardEvent) => {
      if (deleteDialogOpen) return;

      // Ctrl/Cmd + Enter → save (works even when focus is inside the text field)
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && canSave) {
        e.preventDefault();
        e.stopPropagation();
        editCollection(
          { projectId, projectVersionId, collectionId, name: trimmedName },
          { onSuccess: () => handleOpenChange(false) }
        );
        return;
      }

      // Delete → open delete dialog (only when not typing, to avoid interfering
      // with normal text editing in the name field)
      if (e.key === 'Delete' && !isTyping() && !isBusy) {
        e.preventDefault();
        e.stopPropagation();
        setDeleteDialogOpen(true);
      }
    };

    globalThis.addEventListener('keydown', handleKey);
    return () => globalThis.removeEventListener('keydown', handleKey);
  }, [
    open,
    deleteDialogOpen,
    canSave,
    isBusy,
    editCollection,
    projectId,
    projectVersionId,
    collectionId,
    trimmedName,
    handleOpenChange,
  ]);

  return (
    <Modal open={open} onOpenChange={handleOpenChange} title="Edit trace collection">
      <Flex direction="column" gap="4">
        {isEditError && (
          <Callout.Root color="red" size="1">
            <Callout.Icon>
              <Info />
            </Callout.Icon>
            <Callout.Text>Updating the collection failed. Please try again.</Callout.Text>
          </Callout.Root>
        )}

        <Flex direction="column" gap="1">
          <Text as="label" size="2" weight="medium" htmlFor="trace-collection-name">
            Collection name
          </Text>
          <TextField.Root
            id="trace-collection-name"
            value={name}
            onChange={(e) => setNameOverride(e.target.value)}
            disabled={isBusy}
            autoComplete="off"
          />
        </Flex>
      </Flex>

      <Flex direction="row" mt="5" gap="1">
        <DeleteCollectionAlert
          collectionName={collectionName}
          onDelete={handleDelete}
          isPending={isDeletePending}
          isError={isDeleteError}
          isOpen={deleteDialogOpen}
          setIsOpen={setDeleteDialogOpen}
        />

        <Flex style={{ marginLeft: 'auto' }} gap="2">
          <Tooltip content="Press Escape to cancel">
            <Button
              variant="soft"
              color="gray"
              disabled={isBusy}
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
          </Tooltip>

          <Tooltip content="Press Ctrl + Enter to save">
            <Button variant="solid" disabled={!canSave} onClick={handleSubmit}>
              {isEditPending ? (
                <>
                  <Spinner size="1" />
                  Saving…
                </>
              ) : (
                'Save'
              )}
            </Button>
          </Tooltip>
        </Flex>
      </Flex>
    </Modal>
  );
}
