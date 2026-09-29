import { Badge, Flex, IconButton, Skeleton, Text, Tooltip } from '@radix-ui/themes';
import { Settings2 } from 'lucide-react';
import { useState } from 'react';
import { useGetLlmStatus } from '../hooks/useGetLlmStatus.ts';
import { LlmConfigModal } from './LlmConfigModal.tsx';

interface LlmStatusIndicatorProps {
  collapsed?: boolean;
}

export function LlmStatusIndicator({ collapsed = false }: Readonly<LlmStatusIndicatorProps>) {
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

  const dotColor =
    connectionState === 'online'
      ? 'var(--green-9)'
      : connectionState === 'offline'
        ? 'var(--red-9)'
        : 'var(--gray-9)';

  const badgeColors =
    connectionState === 'online'
      ? { color: 'var(--green-11)', bg: 'var(--green-3)', border: 'var(--green-6)' }
      : connectionState === 'offline'
        ? { color: 'var(--red-11)', bg: 'var(--red-3)', border: 'var(--red-6)' }
        : { color: 'var(--gray-11)', bg: 'var(--gray-3)', border: 'var(--gray-6)' };

  if (collapsed) {
    const tooltipContent = (
      <Flex align="center" gap="2" p="1">
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            flexShrink: 0,
            background: dotColor,
          }}
        />
        <Flex direction="column">
          <Text size="1" weight="medium" style={{ color: 'inherit' }}>
            {data?.providerName ?? 'Onbekend'}
          </Text>
          {data?.modelName && (
            <Text size="1" style={{ color: 'inherit', opacity: 0.75 }}>
              {data.modelName}
            </Text>
          )}
        </Flex>
        <Badge
          radius="full"
          style={{
            color: badgeColors.color,
            backgroundColor: badgeColors.bg,
            border: `1px solid ${badgeColors.border}`,
            paddingInline: '8px',
            fontWeight: 600,
            marginLeft: 4,
          }}
        >
          {connectionState}
        </Badge>
      </Flex>
    );

    return (
      <>
        <Flex direction="column" align="center" gap="2" py="1">
          <Tooltip content={tooltipContent}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                flexShrink: 0,
                background: dotColor,
                opacity: isLoading ? 0.4 : 1,
              }}
            />
          </Tooltip>

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

        <LlmConfigModal open={isConfigOpen} onOpenChange={setIsConfigOpen} status={data} />
      </>
    );
  }

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
            background: dotColor,
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
                color: badgeColors.color,
                backgroundColor: badgeColors.bg,
                border: `1px solid ${badgeColors.border}`,
                paddingInline: '8px',
                fontWeight: 600,
              }}
            >
              {connectionState}
            </Badge>
          </Skeleton>

          <Tooltip content="Configure LLM" side="right" sideOffset={8}>
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
