import { Box, Flex, Skeleton, Text } from '@radix-ui/themes';

interface ObjectCounterBoxProps {
  readonly label: string;
  readonly value: number | string;
  readonly loading?: boolean;
}

export default function ObjectCounterBox({ label, value, loading = false }: ObjectCounterBoxProps) {
  return (
    <Box
      style={{
        flex: '1 1 0',
        width: '100%',
        border: '1px solid var(--gray-5)',
        borderRadius: '14px',
        backgroundColor: 'var(--gray-2)',
        padding: '14px 16px',
        minHeight: '70px',
      }}
    >
      <Flex direction="column" gap="1">
        <Text size="1" color="gray">
          {label}
        </Text>
        <Text size="4" weight="bold" style={{ letterSpacing: '-0.01em' }}>
          <Skeleton loading={loading}>{value}</Skeleton>
        </Text>
      </Flex>
    </Box>
  );
}
