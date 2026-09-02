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
  PROJECT_DESCRIPTION_MAX_LENGTH,
  PROJECT_NAME_MAX_LENGTH,
  PROJECT_NAME_MIN_LENGTH,
} from '../../../shared/types/project.ts';
import { useCreateProject } from '../hooks/useCreateProject.ts';
import { Info } from 'lucide-react';
import Modal from '../../../shared/components/Modal.tsx';
import * as React from 'react';
import { useNavigate } from 'react-router';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateProjectModal({ open, onOpenChange: setOpen }: Readonly<ModalProps>) {
  const { mutate, isPending, isError, reset } = useCreateProject();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const isNameValid = name.trim().length >= PROJECT_NAME_MIN_LENGTH;
  const navigate = useNavigate();

  const handleSubmit = () => {
    if (!isNameValid) return;
    mutate(
      {
        name: name.trim(),
        description: description.trim(),
      },
      {
        onSuccess: (result) => {
          setOpen(false);
          navigate(`/projects/${result.projectId}`);
        },
      }
    );
  };

  // Global ctrl+enter keydown listener for the modal
  const handleGlobalKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      e.stopPropagation();
      handleSubmit();
    }
  };

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName('');
      setDescription('');
      reset();
    }
  }, [open, reset]);

  return (
    <Modal
      open={open}
      onOpenChange={setOpen}
      title={'Create Project'}
      description={'Create a project to start evaluating.'}
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

      <Flex justify="end" mt="5" gap="2">
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
                Creating…
              </>
            ) : (
              <Flex align="center" gap="2">
                Create project
              </Flex>
            )}
          </Button>
        </Tooltip>
      </Flex>
    </Modal>
  );
}
