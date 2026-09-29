import { Box, Button, Flex, IconButton, Text, Tooltip } from '@radix-ui/themes';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { CreateVersionModal } from '../../feature/versions/components/CreateVersionModal';

interface CreateVersionItemProps {
  readonly collapsed?: boolean;
  readonly projectId: string;
}

export function CreateVersionItem({
  collapsed = false,
  projectId,
}: Readonly<CreateVersionItemProps>) {
  const [isCreateVersionModalOpen, setIsCreateVersionModalOpen] = useState(false);

  if (collapsed) {
    return (
      <>
        <Flex justify="center" my="1">
          <Tooltip content="New version" side="right" sideOffset={8}>
            <IconButton
              variant="ghost"
              color="gray"
              size="2"
              onClick={() => setIsCreateVersionModalOpen(true)}
              aria-label="New version"
            >
              <Plus size={16} />
            </IconButton>
          </Tooltip>
        </Flex>

        <CreateVersionModal
          projectId={projectId}
          isOpen={isCreateVersionModalOpen}
          onOpenChange={(open) => setIsCreateVersionModalOpen(open)}
        />
      </>
    );
  }

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
