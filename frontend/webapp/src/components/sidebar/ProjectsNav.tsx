import { useEffect, useState } from 'react';
import { useMatch, useNavigate } from 'react-router';
import { useGetAllProjects } from '../../feature/projects/hooks/useGetAllProjects.ts';
import type { Project } from '../../shared/types/project.ts';
import CreateProjectModal from '../../feature/projects/components/CreateProjectModal.tsx';
import EditProjectModal from '../../feature/projects/components/EditProjectModal.tsx';
import { isTyping } from '../../shared/util/shortcutHelpers.ts';
import { ProjectSelector } from './ProjectSelector.tsx';
import { ProjectVersionsNav } from './ProjectVersionsNav.tsx';
import { useGetProject } from '../../feature/projects/hooks/useGetProject.ts';
import { Box, Text } from '@radix-ui/themes';

interface ProjectsNavProps {
  collapsed?: boolean;
}

export function ProjectsNav({ collapsed = false }: ProjectsNavProps) {
  const { data, isLoading } = useGetAllProjects();
  const projects = data?.projects ?? [];

  const projectExactMatch = useMatch('/projects/:id');
  const projectDeepMatch = useMatch('/projects/:id/*');
  const versionDeepMatch = useMatch('/projects/:id/versions/:versionId/*');

  const currentProjectId = projectDeepMatch?.params?.id ?? projectExactMatch?.params?.id;
  const currentVersionId = versionDeepMatch?.params?.versionId;
  const currentProject = projects.find((p) => p.projectId === currentProjectId);
  const {
    data: projectData,
    isLoading: isProjectLoading,
    error: projectError,
  } = useGetProject(currentProjectId);

  const [keyFocusedIndex, setKeyFocusedIndex] = useState(-1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Omit<Project, 'versions'> | undefined>();

  const navigate = useNavigate();

  // Keep the focused/highlighted version in sync with the actual selected
  // version, however it changed (click, shortcut, direct URL nav, etc).
  useEffect(() => {
    const versions = projectData?.versions ?? [];
    const idx = versions.findIndex((v) => v.versionId === currentVersionId);
    setKeyFocusedIndex(idx);
  }, [currentVersionId, projectData]);

  // ─── Keyboard shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (isTyping()) return;
      if (!currentProjectId) return;

      const versions = projectData?.versions ?? [];

      if (e.key === '[' || e.key === ']') {
        e.preventDefault();
        if (versions.length === 0) return;
        const currentIndex = versions.findIndex((v) => v.versionId === currentVersionId);
        const nextIndex =
          e.key === '['
            ? currentIndex <= 0
              ? versions.length - 1
              : currentIndex - 1
            : currentIndex < 0 || currentIndex >= versions.length - 1
              ? 0
              : currentIndex + 1;
        navigate(
          `/projects/${currentProjectId}/versions/${versions[nextIndex].versionId}/overview`
        );
        return;
      }

      if (e.key.toLowerCase() === 'h') {
        e.preventDefault();
        navigate(`/projects/${currentProjectId}`);
        return;
      }

      if (currentVersionId) {
        const pageById: Record<string, string> = {
          '1': 'overview',
          '2': 'open-code',
          '3': 'axial-code',
        };
        const page = pageById[e.key];
        if (page) navigate(`/projects/${currentProjectId}/versions/${currentVersionId}/${page}`);
      }
    };

    globalThis.addEventListener('keydown', handleKey);
    return () => globalThis.removeEventListener('keydown', handleKey);
  }, [currentProjectId, currentVersionId, navigate, projectData]);

  return (
    <>
      <ProjectSelector
        collapsed={collapsed}
        isLoading={isLoading}
        projects={projects}
        currentProjectId={currentProjectId}
        onEditProject={setEditTarget}
        onCreateProject={() => setIsCreateModalOpen(true)}
      />

      {!isProjectLoading && projectError && (
        <Box px="3" mb="4">
          <Text size="2" color="red">
            Failed to load project: {projectError.message}
          </Text>
        </Box>
      )}

      {currentProjectId && currentProject && projectData && !isProjectLoading && (
        <ProjectVersionsNav
          collapsed={collapsed}
          projectId={currentProjectId}
          projectName={currentProject.name}
          versions={projectData?.versions ?? []}
          currentVersionId={currentVersionId}
          keyFocusedIndex={keyFocusedIndex}
        />
      )}

      <CreateProjectModal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} />
      <EditProjectModal
        project={editTarget}
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open) setEditTarget(undefined);
        }}
      />
    </>
  );
}
