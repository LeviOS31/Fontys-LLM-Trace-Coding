import { Badge, Flex, IconButton, Skeleton, Text, Tooltip } from '@radix-ui/themes';
import { Settings2 } from 'lucide-react';
import { useState } from 'react';
import { useGetLlmStatus } from '../hooks/useGetLlmStatus.ts';
import { LlmConfigModal } from './LlmConfigModal.tsx';

export function LlmStatusIndicator() {
  const { data, isLoading, isError } = useGetLlmStatus();
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const isConnected = data?.isConnected;
  const connectionState = isError
    ? 'offline'
    : isConnected === true
      ? 'online'
      : isConnected === false
        ? 'offline'
        : '...';

  return (
    <>
      <Flex
        align="center"
        gap="2"
        p="2"
        style={{
          borderRadius: 'var(--radius-3)',
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            flexShrink: 0,
            background:
              connectionState === 'online'
                ? 'var(--green-9)'
                : connectionState === 'offline'
                  ? 'var(--red-9)'
                  : 'var(--gray-9)',
          }}
        />

        <Flex direction="column" flexGrow="1" minWidth="0">
          <Skeleton loading={isLoading}>
            <Text size="1" weight="medium" truncate style={{ color: 'var(--gray-12)' }}>
              {data?.providerName ?? 'Onbekend'}
            </Text>
          </Skeleton>
          {data?.modelName && (
            <Text size="1" color="gray" truncate>
              {data.modelName}
            </Text>
          )}
        </Flex>

        <Flex align="center" gap="2">
          <Skeleton loading={isLoading}>
            <Badge
              radius="full"
              style={{
                color:
                  connectionState === 'online'
                    ? 'var(--green-11)'
                    : connectionState === 'offline'
                      ? 'var(--red-11)'
                      : 'var(--gray-11)',
                backgroundColor:
                  connectionState === 'online'
                    ? 'var(--green-3)'
                    : connectionState === 'offline'
                      ? 'var(--red-3)'
                      : 'var(--gray-3)',
                border: `1px solid ${
                  connectionState === 'online'
                    ? 'var(--green-6)'
                    : connectionState === 'offline'
                      ? 'var(--red-6)'
                      : 'var(--gray-6)'
                }`,
                paddingInline: '8px',
                fontWeight: 600,
              }}
            >
              {connectionState}
            </Badge>
          </Skeleton>

          <Tooltip content="Configure LLM">
            <IconButton
              size="1"
              variant="soft"
              color="gray"
              onClick={() => setIsConfigOpen(true)}
              style={{ cursor: 'pointer' }}
              aria-label="Configure LLM"
            >
              <Settings2 size="14" />
            </IconButton>
          </Tooltip>
        </Flex>
      </Flex>

      <LlmConfigModal open={isConfigOpen} onOpenChange={setIsConfigOpen} status={data} />
    </>
  );
}
