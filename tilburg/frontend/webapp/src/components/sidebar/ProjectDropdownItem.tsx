import { useRef } from 'react';
import { Edit } from 'lucide-react';
import { Box, DropdownMenu, Flex, Text } from '@radix-ui/themes';
import type { Project } from '../../shared/types/project.ts';
import { colors } from '../../shared/styling/colors.ts';

interface ProjectDropdownItemProps {
  project: Omit<Project, 'versions'>;
  isActive: boolean;
  onEditProject: (project: Omit<Project, 'versions'>) => void;
  onNavigate: (projectId: string) => void;
  onCloseDropdown: () => void;
}

export function ProjectDropdownItem({
  project,
  isActive,
  onEditProject,
  onNavigate,
  onCloseDropdown,
}: Readonly<ProjectDropdownItemProps>) {
  const editClickedRef = useRef(false);

  return (
    <DropdownMenu.Item
      onSelect={(e) => {
        if (editClickedRef.current) {
          editClickedRef.current = false;
          e.preventDefault();
          return;
        }
        onNavigate(project.projectId);
      }}
      color={isActive ? colors.theme.radix.primary : colors.theme.radix.gray}
      style={{ fontWeight: isActive ? 500 : undefined }}
    >
      <Flex align="center" justify="between" style={{ width: '100%' }}>
        <Text size="2">{project.name}</Text>
        <Box
          aria-label="Edit project"
          onPointerDown={() => {
            editClickedRef.current = true;
          }}
          onClick={() => {
            onCloseDropdown();
            onEditProject(project);
          }}
        >
          <Edit size={13} />
        </Box>
      </Flex>
    </DropdownMenu.Item>
  );
}
