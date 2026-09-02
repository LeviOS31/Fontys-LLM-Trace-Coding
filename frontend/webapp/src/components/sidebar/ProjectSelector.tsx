import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronDown, Plus } from 'lucide-react';
import { Box, Button, DropdownMenu, Flex, Text } from '@radix-ui/themes';
import type { Project } from '../../shared/types/project.ts';
import { ProjectDropdownItem } from './ProjectDropdownItem.tsx';

interface ProjectSelectorProps {
  isLoading: boolean;
  projects: Omit<Project, 'versions'>[];
  currentProjectId: string | undefined;
  onEditProject: (project: Omit<Project, 'versions'>) => void;
  onCreateProject: () => void;
}

export function ProjectSelector({
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

          <DropdownMenu.Content style={{ minWidth: 'var(--radix-dropdown-menu-trigger-width)' }}>
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
