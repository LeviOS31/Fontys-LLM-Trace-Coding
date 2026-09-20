import { Flex, Text } from '@radix-ui/themes';
import { LayoutDashboard } from 'lucide-react';

/**
 * Index route of the open coding flow. The trace list itself lives in the
 * sidebar (see OpenCodeLayout), so this is only the placeholder shown until a
 * trace group is picked.
 */
export default function OpenCodePage() {
  return (
    <Flex direction="column" align="center" justify="center" gap="3" style={{ height: '100%' }}>
      <LayoutDashboard size={28} color="var(--gray-9)" />
      <Text size="4" weight="bold">
        Open coding
      </Text>
      <Text color="gray" size="2" align="center">
        Select a trace group in the sidebar to start coding.
      </Text>
    </Flex>
  );
}
