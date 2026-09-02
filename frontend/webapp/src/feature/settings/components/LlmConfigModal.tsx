import { Button, Callout, Dialog, Flex, Text, TextField, Tooltip } from '@radix-ui/themes';
import { Info } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Modal from '../../../shared/components/Modal.tsx';
import type { LlmStatus, SetLlmConfigDto } from '../../../shared/types/settings.ts';
import { useSetLlmConfig } from '../hooks/useSetLlmConfig.ts';
import { useGetDefaultLlmConfig } from '../hooks/useGetDefaultLlmConfig.ts';

interface LlmConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status?: LlmStatus;
}

function isValidUrl(value: string) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function LlmConfigModal({ open, onOpenChange, status }: LlmConfigModalProps) {
  const { mutate, isPending, isError, reset } = useSetLlmConfig();
  const { data: defaultLlmConfig, isFetching: isResetting } = useGetDefaultLlmConfig();
  const [providerName, setProviderName] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [modelName, setModelName] = useState('');
  const [resetError, setResetError] = useState(false);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProviderName(status?.providerName ?? '');
    setEndpoint(status?.endpoint ?? '');
    setModelName(status?.modelName ?? '');
    setResetError(false);
    reset();
  }, [open, reset, status]);

  const trimmedProvider = providerName.trim();
  const trimmedEndpoint = endpoint.trim();
  const trimmedModel = modelName.trim();

  const isClearing = !trimmedProvider && !trimmedEndpoint && !trimmedModel;
  const hasAllValues = !!trimmedProvider && !!trimmedEndpoint && !!trimmedModel;
  const endpointIsValid = isClearing || isValidUrl(trimmedEndpoint);

  const validationMessage = useMemo(() => {
    if (isClearing) return undefined;
    if (!hasAllValues) return 'Provide a provider, endpoint, and model, or clear all fields.';
    if (!endpointIsValid) return 'Endpoint must be a valid URL (including http/https).';
    return undefined;
  }, [endpointIsValid, hasAllValues, isClearing]);

  const isFormValid = (isClearing || hasAllValues) && endpointIsValid;

  const handleSubmit = () => {
    if (!isFormValid) return;

    const payload: SetLlmConfigDto = isClearing
      ? {
          providerName: null,
          endpoint: null,
          modelName: null,
        }
      : {
          providerName: trimmedProvider,
          endpoint: trimmedEndpoint,
          modelName: trimmedModel,
        };

    mutate(payload, {
      onSuccess: () => onOpenChange(false),
    });
  };

  const handleResetToDefaults = () => {
    setResetError(false);

    if (!defaultLlmConfig) {
      setResetError(true);
      return;
    }

    setProviderName(defaultLlmConfig.providerName ?? '');
    setEndpoint(defaultLlmConfig.endpoint ?? '');
    setModelName(defaultLlmConfig.modelName ?? '');
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="LLM configuration"
      description="Update the provider, endpoint, and model used for analysis."
    >
      <Flex direction="column" gap="4">
        {isError && (
          <Callout.Root color="red" size="1">
            <Callout.Icon>
              <Info />
            </Callout.Icon>
            <Callout.Text>Failed to update configuration. Please try again.</Callout.Text>
          </Callout.Root>
        )}

        {resetError && (
          <Callout.Root color="red" size="1">
            <Callout.Icon>
              <Info />
            </Callout.Icon>
            <Callout.Text>Failed to load default configuration. Please try again.</Callout.Text>
          </Callout.Root>
        )}

        <Flex direction="column" gap="1">
          <Text as="label" size="2" weight="medium" htmlFor="llm-provider">
            Provider name
          </Text>
          <TextField.Root
            id="llm-provider"
            placeholder="e.g. OpenAI"
            value={providerName}
            onChange={(e) => setProviderName(e.target.value)}
            autoComplete="off"
            disabled={isPending}
          />
        </Flex>

        <Flex direction="column" gap="1">
          <Text as="label" size="2" weight="medium" htmlFor="llm-endpoint">
            Endpoint
          </Text>
          <TextField.Root
            id="llm-endpoint"
            placeholder="https://api.example.com"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            autoComplete="off"
            disabled={isPending}
            type="url"
          />
        </Flex>

        <Flex direction="column" gap="1">
          <Text as="label" size="2" weight="medium" htmlFor="llm-model">
            Model name
          </Text>
          <TextField.Root
            id="llm-model"
            placeholder="e.g. gpt-4"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            autoComplete="off"
            disabled={isPending}
          />
        </Flex>

        <Text size="1" color={validationMessage ? 'red' : 'gray'}>
          {validationMessage ??
            'Leave all fields empty to clear the configuration or reset to default.'}
        </Text>
      </Flex>

      <Flex justify="end" mt="5" gap="2">
        <Dialog.Close>
          <Tooltip content="Press Escape to cancel">
            <Button variant="soft" color="gray" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </Tooltip>
        </Dialog.Close>

        <Button
          variant="soft"
          color="gray"
          onClick={handleResetToDefaults}
          disabled={isPending || isResetting}
        >
          {isResetting ? 'Loading…' : 'Reset to default'}
        </Button>

        <Button variant="solid" disabled={!isFormValid || isPending} onClick={handleSubmit}>
          {isPending ? 'Saving…' : 'Save'}
        </Button>
      </Flex>
    </Modal>
  );
}
