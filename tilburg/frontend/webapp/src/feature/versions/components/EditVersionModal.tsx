import {
  Button,
  Callout,
  Dialog,
  Flex,
  Spinner,
  Text,
  TextArea,
  TextField,
  Tooltip,
} from '@radix-ui/themes';
import { Info } from 'lucide-react';
import { useEffect, useState } from 'react';
import * as React from 'react';
import { useNavigate } from 'react-router';
import Modal from '../../../shared/components/Modal.tsx';
import {
  VERSION_DESCRIPTION_MAX_LENGTH,
  VERSION_NAME_MAX_LENGTH,
  VERSION_NAME_MIN_LENGTH,
  type Version,
} from '../../../shared/types/version.ts';
import { useDeleteVersion } from '../hooks/useDeleteVersion.ts';
import { useEditVersion } from '../hooks/useEditVersion.ts';
import { DeleteVersionAlertDialog } from './DeleteVersionAlertDialog.tsx';

interface EditVersionModalProps {
  version?: Version;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditVersionModal({ version, open, onOpenChange }: Readonly<EditVersionModalProps>) {
  const { mutate, isPending, isError, error, reset } = useEditVersion();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const {
    mutate: deleteVersionMutate,
    isPending: isDeletePending,
    isError: isDeleteError,
    reset: resetDelete,
  } = useDeleteVersion();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const navigate = useNavigate();

  const isNameValid = name.trim().length >= VERSION_NAME_MIN_LENGTH;
  const isDescriptionValid = description.trim().length > 0;
  const errorMessage =
    error?.status === 409
      ? 'There already exists a version with this name within this project.'
      : 'Something went wrong. Please try again.';

  useEffect(() => {
    if (open && version) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(version.name ?? '');
      setDescription(version.description ?? '');
      reset();
      resetDelete();
    }
  }, [open, reset, resetDelete, version]);

  if (!version) return null;

  const handleSubmit = () => {
    if (!isNameValid || !isDescriptionValid) return;

    mutate(
      {
        projectId: version.projectId,
        versionId: version.versionId,
        name: name.trim(),
        description: description.trim(),
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  const handleDelete = () => {
    deleteVersionMutate(
      {
        projectId: version.projectId,
        versionId: version.versionId,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          navigate(`/projects/${version.projectId}`);
        },
      }
    );
  };

  const handleGlobalKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !deleteDialogOpen) {
      e.preventDefault();
      e.stopPropagation();
      handleSubmit();
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit the Version"
      description="Update the selected version details."
      onKeyDown={handleGlobalKeyDown}
    >
      <Flex direction="column" gap="4">
        {isError && (
          <Callout.Root color="red" size="1">
            <Callout.Icon>
              <Info />
            </Callout.Icon>
            <Callout.Text>{errorMessage}</Callout.Text>
          </Callout.Root>
        )}

        <Flex direction="column" gap="1">
          <Text as="label" size="2" weight="medium" htmlFor="version-name">
            Version name <Text color="red">*</Text>
          </Text>
          <TextField.Root
            id="version-name"
            placeholder="e.g. v1.2.3"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={VERSION_NAME_MAX_LENGTH}
            autoComplete="off"
            disabled={isPending}
          />
          <Text
            size="1"
            color={name.length > 0 && name.trim().length < VERSION_NAME_MIN_LENGTH ? 'red' : 'gray'}
          >
            {name.length}/{VERSION_NAME_MAX_LENGTH} (min {VERSION_NAME_MIN_LENGTH})
          </Text>
        </Flex>

        <Flex direction="column" gap="1">
          <Text as="label" size="2" weight="medium" htmlFor="version-desc">
            Description <Text color="red">*</Text>
          </Text>
          <TextArea
            id="version-desc"
            placeholder="What's this version about?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={VERSION_DESCRIPTION_MAX_LENGTH}
            rows={3}
            disabled={isPending}
          />
          <Text size="1" color="gray">
            {description.length}/{VERSION_DESCRIPTION_MAX_LENGTH}
          </Text>
        </Flex>
      </Flex>

      <Flex direction="row" mt="5" gap="1">
        <DeleteVersionAlertDialog
          versionName={version.name}
          onDelete={handleDelete}
          isPending={isDeletePending}
          isError={isDeleteError}
          isOpen={deleteDialogOpen}
          setIsOpen={setDeleteDialogOpen}
        />
        <Flex style={{ marginLeft: 'auto' }} gap="2">
          <Dialog.Close>
            <Tooltip content="Press Escape to cancel">
              <Button variant="soft" color="gray" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </Tooltip>
          </Dialog.Close>

          <Tooltip content="Press Ctrl + Enter to submit">
            <Button
              variant="solid"
              disabled={!isNameValid || !isDescriptionValid || isPending}
              onClick={handleSubmit}
            >
              {isPending ? (
                <>
                  <Spinner size="1" />
                  Saving…
                </>
              ) : (
                <Flex align="center" gap="2">
                  Save version
                </Flex>
              )}
            </Button>
          </Tooltip>
        </Flex>
      </Flex>
    </Modal>
  );
}
