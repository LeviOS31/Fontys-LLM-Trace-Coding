import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronDown, Plus, Folder } from 'lucide-react';
import { Box, Button, DropdownMenu, Flex, IconButton, Text, Tooltip } from '@radix-ui/themes';
import type { Project } from '../../shared/types/project.ts';
import { ProjectDropdownItem } from './ProjectDropdownItem.tsx';

interface ProjectSelectorProps {
  collapsed?: boolean;
  isLoading: boolean;
  projects: Omit<Project, 'versions'>[];
  currentProjectId: string | undefined;
  onEditProject: (project: Omit<Project, 'versions'>) => void;
  onCreateProject: () => void;
}

export function ProjectSelector({
  collapsed = false,
  isLoading,
  projects,
  currentProjectId,
  onEditProject,
  onCreateProject,
}: Readonly<ProjectSelectorProps>) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const currentProject = projects.find((p) => p.projectId === currentProjectId);
  const hasProjects = !isLoading && projects.length > 0;

  const menuContent = (
    <DropdownMenu.Content
      style={{ minWidth: collapsed ? 220 : 'var(--radix-dropdown-menu-trigger-width)' }}
    >
      {projects.map((project) => (
        <ProjectDropdownItem
          key={project.projectId}
          project={project}
          isActive={project.projectId === currentProjectId}
          onEditProject={onEditProject}
          onNavigate={(id) => navigate(`/projects/${id}`)}
          onCloseDropdown={() => setDropdownOpen(false)}
        />
      ))}

      <DropdownMenu.Separator />
      <DropdownMenu.Item onSelect={onCreateProject}>
        <Flex align="center" gap="2">
          <Plus size={14} />
          <Text size="2">Create new project</Text>
        </Flex>
      </DropdownMenu.Item>
    </DropdownMenu.Content>
  );

  if (collapsed) {
    return (
      <Box mb="4" style={{ display: 'flex', justifyContent: 'center' }}>
        {isLoading || hasProjects ? (
          <DropdownMenu.Root open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <Tooltip
              content={isLoading ? 'Loading…' : (currentProject?.name ?? 'Select a project')}
              side="right"
              sideOffset={8}
            >
              <DropdownMenu.Trigger>
                <IconButton
                  data-testid="project-selector"
                  variant="soft"
                  color="gray"
                  className="project-selector-collapsed-trigger"
                >
                  <Folder size={20} />
                </IconButton>
              </DropdownMenu.Trigger>
            </Tooltip>
            {menuContent}
          </DropdownMenu.Root>
        ) : (
          <Tooltip content="Add project" side="right" sideOffset={8}>
            <IconButton
              variant="soft"
              className="project-selector-collapsed-trigger"
              onClick={onCreateProject}
            >
              <Plus size={16} />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    );
  }

  return (
    <Box px="3" mb="4">
      {isLoading || hasProjects ? (
        <DropdownMenu.Root open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenu.Trigger>
            <Button
              data-testid="project-selector"
              variant="soft"
              color="gray"
              style={{ width: '100%' }}
            >
              <Flex align="center" justify="between" style={{ width: '100%' }}>
                <Text size="2" truncate>
                  {isLoading ? 'Loading…' : (currentProject?.name ?? 'Select a project')}
                </Text>
                <ChevronDown size={14} />
              </Flex>
            </Button>
          </DropdownMenu.Trigger>
          {menuContent}
        </DropdownMenu.Root>
      ) : (
        <Flex justify="center">
          <Button variant="soft" size="3" onClick={onCreateProject}>
            <Plus /> Add Project
          </Button>
        </Flex>
      )}
    </Box>
  );
}
