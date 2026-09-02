import { Button, Flex, Text } from '@radix-ui/themes';
import { Pencil, type LucideIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { useGetProject } from '../../projects/hooks/useGetProject.ts';
import { EditVersionModal } from './EditVersionModal.tsx';

interface VersionPageHeaderProps {
  title: string;
  Icon: LucideIcon;
}

export function VersionPageHeader({ title, Icon }: Readonly<VersionPageHeaderProps>) {
  const { id, versionId } = useParams<{ id: string; versionId: string }>();
  const { data, isLoading } = useGetProject(id);
  const [isEditVersionModalOpen, setIsEditVersionModalOpen] = useState(false);

  const currentVersion = useMemo(
    () => data?.versions.find((version) => version.versionId === versionId),
    [data?.versions, versionId]
  );

  return (
    <>
      <Flex align="center" justify="between" gap="3">
        <Flex align="center" gap="2">
          <Icon size={20} />
          <Text size="6" weight="bold">
            {title}
          </Text>
        </Flex>

        <Button
          variant="soft"
          disabled={isLoading || !currentVersion}
          onClick={() => setIsEditVersionModalOpen(true)}
        >
          <Pencil size={16} />
          Edit version
        </Button>
      </Flex>

      <EditVersionModal
        version={currentVersion}
        open={isEditVersionModalOpen}
        onOpenChange={setIsEditVersionModalOpen}
      />
    </>
  );
}
