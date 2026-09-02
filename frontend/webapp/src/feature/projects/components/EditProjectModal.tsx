import {
  Dialog,
  Button,
  Flex,
  Text,
  TextField,
  TextArea,
  Spinner,
  Callout,
  Tooltip,
} from '@radix-ui/themes';
import { useEffect, useState } from 'react';
import {
  type Project,
  PROJECT_DESCRIPTION_MAX_LENGTH,
  PROJECT_NAME_MAX_LENGTH,
  PROJECT_NAME_MIN_LENGTH,
} from '../../../shared/types/project.ts';
import { Info } from 'lucide-react';
import Modal from '../../../shared/components/Modal.tsx';
import * as React from 'react';
import { useEditProject } from '../hooks/useEditProject.ts';
import { DeleteAlertDialog } from './DeleteAlertDialog.tsx';
import { useDeleteProject } from '../hooks/useDeleteProject.ts';
import { useNavigate } from 'react-router';

interface EditModalProps {
  project?: Omit<Project, 'versions'>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditProjectModal({
  project,
  open,
  onOpenChange: setOpen,
}: Readonly<EditModalProps>) {
  const { mutate, isPending, isError, reset } = useEditProject();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const {
    mutate: deleteProjectMutate,
    isPending: isDeletePending,
    isError: isDeleteError,
    reset: resetDelete,
  } = useDeleteProject();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const navigate = useNavigate();

  const isNameValid = name.trim().length >= PROJECT_NAME_MIN_LENGTH;

  useEffect(() => {
    if (open && project) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(project.name ?? '');
      setDescription(project.description ?? '');
      reset();
      resetDelete();
    }
  }, [open, project, reset, resetDelete]);

  if (!project) return null;

  const handleSubmit = () => {
    if (!isNameValid) return;
    mutate(
      {
        projectId: project.projectId,
        name: name.trim(),
        description: description.trim(),
      },
      {
        onSuccess: () => {
          setOpen(false);
        },
      }
    );
  };

  const handleDelete = () => {
    deleteProjectMutate(project.projectId, {
      onSuccess: () => {
        setOpen(false);
        navigate(`/`);
      },
    });
  };

  // Global ctrl+enter keydown listener for the modal
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
      onOpenChange={setOpen}
      title={'Edit the Project'}
      onKeyDown={handleGlobalKeyDown}
    >
      <Flex direction="column" gap="4">
        {isError && (
          <Callout.Root color="red" size="1">
            <Callout.Icon>
              <Info />
            </Callout.Icon>
            <Callout.Text>Something went wrong. Please try again.</Callout.Text>
          </Callout.Root>
        )}

        <Flex direction="column" gap="1">
          <Text as="label" size="2" weight="medium" htmlFor="project-name">
            Project name <Text color="red">*</Text>
          </Text>
          <TextField.Root
            id="project-name"
            placeholder="e.g. Customer Service AI-chatbot"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={PROJECT_NAME_MAX_LENGTH}
            autoComplete="off"
            disabled={isPending}
          />
          <Text
            size="1"
            color={name.length > 0 && name.trim().length < PROJECT_NAME_MIN_LENGTH ? 'red' : 'gray'}
          >
            {name.length}/{PROJECT_NAME_MAX_LENGTH} (min {PROJECT_NAME_MIN_LENGTH})
          </Text>
        </Flex>

        <Flex direction="column" gap="1">
          <Text as="label" size="2" weight="medium" htmlFor="project-desc">
            Description
          </Text>
          <TextArea
            id="project-desc"
            placeholder="What's this project about? (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={PROJECT_DESCRIPTION_MAX_LENGTH}
            rows={3}
            disabled={isPending}
          />
          <Text size="1" color="gray">
            {description.length}/{PROJECT_DESCRIPTION_MAX_LENGTH}
          </Text>
        </Flex>
      </Flex>
      <Flex direction="row" mt="5" gap="1">
        <DeleteAlertDialog
          projectName={project.name}
          onDelete={handleDelete}
          isPending={isDeletePending}
          isError={isDeleteError}
          isOpen={deleteDialogOpen}
          setIsOpen={setDeleteDialogOpen}
        />
        <Flex style={{ marginLeft: 'auto' }} gap="2">
          <Dialog.Close>
            <Tooltip content="Press Escape to cancel">
              <Button variant="soft" color="gray" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </Tooltip>
          </Dialog.Close>

          <Tooltip content="Press Ctrl + Enter to submit">
            <Button variant="solid" disabled={!isNameValid || isPending} onClick={handleSubmit}>
              {isPending ? (
                <>
                  <Spinner size="1" />
                  Saving…
                </>
              ) : (
                <Flex align="center" gap="2">
                  Save project
                </Flex>
              )}
            </Button>
          </Tooltip>
        </Flex>
      </Flex>
    </Modal>
  );
}
