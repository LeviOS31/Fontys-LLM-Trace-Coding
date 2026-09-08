import {
  Button,
  Callout,
  Flex,
  Spinner,
  Text,
  TextArea,
  TextField,
  Tooltip,
} from '@radix-ui/themes';
import Modal from '../../../shared/components/Modal';
import { Info } from 'lucide-react';
import { Dialog } from 'radix-ui';
import { useEffect, useState } from 'react';
import {
  VERSION_DESCRIPTION_MAX_LENGTH,
  VERSION_NAME_MAX_LENGTH,
  VERSION_NAME_MIN_LENGTH,
} from '../../../shared/types/version';
import { useNavigate } from 'react-router';
import { useCreateVersion } from '../hooks/useCreateVersion';

interface CreateVersionModalProps {
  readonly projectId: string;
  readonly isOpen: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function CreateVersionModal({
  projectId,
  isOpen,
  onOpenChange,
}: Readonly<CreateVersionModalProps>) {
  const { mutate, isPending, isError, error, reset } = useCreateVersion();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const isNameValid =
    name.trim().length >= VERSION_NAME_MIN_LENGTH && name.trim().length <= VERSION_NAME_MAX_LENGTH;
  const isDescriptionValid =
    description.trim().length <= VERSION_DESCRIPTION_MAX_LENGTH && description.trim().length > 0;
  const errorMessage =
    error?.status === 409
      ? 'There already exists a version with this name within this project.'
      : 'Something went wrong. Please try again.';
  const navigate = useNavigate();

  const handleSubmit = () => {
    if (!isNameValid) return;
    mutate(
      {
        projectId,
        name: name.trim(),
        description: description.trim(),
      },
      {
        onSuccess: (result) => {
          onOpenChange(false);
          navigate(`/projects/${result.projectId}/versions/${result.versionId}/overview`);
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
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName('');
      setDescription('');
      reset();
    }
  }, [isOpen, reset]);

  return (
    <Modal
      open={isOpen}
      onOpenChange={onOpenChange}
      title="Create new version"
      description="Create a new version for your project."
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
          <Text as="label" size="2" weight="medium" htmlFor="project-desc">
            Description <Text color="red">*</Text>
          </Text>
          <TextArea
            id="project-desc"
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

      <Flex justify="end" mt="5" gap="2">
        <Dialog.Close asChild>
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
                Creating…
              </>
            ) : (
              <Flex align="center" gap="2">
                Create version
              </Flex>
            )}
          </Button>
        </Tooltip>
      </Flex>
    </Modal>
  );
}
