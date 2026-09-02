import { Box, Button, Flex, Text } from '@radix-ui/themes';
import { useState } from 'react';
import { CreateVersionModal } from '../../feature/versions/components/CreateVersionModal';

interface CreateVersionItemProps {
  readonly projectId: string;
}

export function CreateVersionItem({ projectId }: Readonly<CreateVersionItemProps>) {
  const [isCreateVersionModalOpen, setIsCreateVersionModalOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        color="gray"
        className="create-version-ghost-item"
        onClick={() => setIsCreateVersionModalOpen(true)}
      >
        <Flex align="center" gap="2">
          <Box width="15px" style={{ display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
            <Text as="span" size="2" weight="medium" style={{ lineHeight: 1 }}>
              +
            </Text>
          </Box>
          <Text as="span" size="2" weight="medium">
            New version
          </Text>
        </Flex>
      </Button>

      <CreateVersionModal
        projectId={projectId}
        isOpen={isCreateVersionModalOpen}
        onOpenChange={(open) => setIsCreateVersionModalOpen(open)}
      />
    </>
  );
}
