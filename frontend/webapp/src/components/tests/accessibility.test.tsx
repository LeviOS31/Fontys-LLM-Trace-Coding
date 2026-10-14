import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/react';
import { Theme } from '@radix-ui/themes';
import axe from 'axe-core';
import { Home, Search } from 'lucide-react';
import type { PropsWithChildren, ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppLayout } from '../AppLayout.tsx';
import { CreateVersionItem } from '../sidebar/CreateVersionItem.tsx';
import { ProjectDropdownItem } from '../sidebar/ProjectDropdownItem.tsx';
import { ProjectNavItem } from '../sidebar/ProjectNavItem.tsx';
import { ProjectSelector } from '../sidebar/ProjectSelector.tsx';
import { ProjectVersionsNav } from '../sidebar/ProjectVersionsNav.tsx';
import { Sidebar } from '../Sidebar.tsx';
import { SidebarNavItem } from '../sidebar/SidebarNavItem.tsx';
import { VersionRow } from '../sidebar/VersionRow.tsx';

const projectList = [
  {
    projectId: 'project-1',
    userId: 'user-1',
    name: 'Alpha',
    description: 'Alpha project',
    assessmentCriteria: [],
  },
];

const project = {
  ...projectList[0],
  versions: [
    {
      versionId: 'version-1',
      projectId: 'project-1',
      name: 'Initial analysis',
      description: 'First pass',
    },
  ],
};

vi.mock('@radix-ui/themes', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@radix-ui/themes')>();
  return {
    ...actual,
    Tooltip: ({ children }: PropsWithChildren) => <>{children}</>,
    DropdownMenu: {
      Root: ({ children }: PropsWithChildren) => <>{children}</>,
      Trigger: ({ children }: PropsWithChildren) => <>{children}</>,
      Content: ({ children }: PropsWithChildren) => <div>{children}</div>,
      Separator: () => <hr />,
      Item: ({ children, onSelect }: { children: ReactNode; onSelect?: (event: { preventDefault: () => void }) => void }) => (
        <button type="button" onClick={() => onSelect?.({ preventDefault: () => {} })}>
          {children}
        </button>
      ),
    },
  };
});

const { useGetAllProjects, useGetProject } = vi.hoisted(() => ({
  useGetAllProjects: vi.fn(),
  useGetProject: vi.fn(),
}));

vi.mock('../../feature/projects/hooks/useGetAllProjects.ts', () => ({ useGetAllProjects }));
vi.mock('../../feature/projects/hooks/useGetProject.ts', () => ({ useGetProject }));
vi.mock('../../feature/projects/components/CreateProjectModal.tsx', () => ({
  default: ({ open }: { open: boolean }) => (open ? <div>Create project modal</div> : null),
}));
vi.mock('../../feature/projects/components/EditProjectModal.tsx', () => ({
  default: ({ open }: { open: boolean }) => (open ? <div>Edit project modal</div> : null),
}));
vi.mock('../../feature/versions/components/CreateVersionModal', () => ({
  CreateVersionModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div>Create version modal</div> : null,
}));
vi.mock('../../feature/settings/components/LlmStatusIndicator.tsx', () => ({
  LlmStatusIndicator: ({ collapsed }: { collapsed?: boolean }) => (
    <div>{collapsed ? 'LLM collapsed' : 'LLM status'}</div>
  ),
}));

async function expectNoA11yViolations(ui: React.ReactElement) {
  const { container } = render(<Theme>{ui}</Theme>);
  const results = await axe.run(container);
  expect(results.violations).toHaveLength(0);
}

describe('frontend accessibility smoke tests', () => {
  beforeEach(() => {
    useGetAllProjects.mockReturnValue({ data: { projects: projectList }, isLoading: false });
    useGetProject.mockReturnValue({ data: project, isLoading: false, error: undefined });
  });

  it('renders AppLayout without accessibility violations', async () => {
    await expectNoA11yViolations(
      <MemoryRouter initialEntries={['/projects/project-1/versions/version-1/overview']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/projects/:id/versions/:versionId/overview" element={<div>Overview</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
  });

  it('renders Sidebar without accessibility violations', async () => {
    useGetAllProjects.mockReturnValue({ data: { projects: projectList }, isLoading: false });
    useGetProject.mockReturnValue({ data: project, isLoading: false, error: undefined });

    await expectNoA11yViolations(
      <MemoryRouter initialEntries={['/projects/project-1/versions/version-1/overview']}>
        <Sidebar />
      </MemoryRouter>
    );
  });

  it('renders core sidebar controls without accessibility violations', async () => {
    await expectNoA11yViolations(
      <MemoryRouter>
        <>
          <ProjectSelector
            isLoading={false}
            projects={projectList}
            currentProjectId="project-1"
            onEditProject={vi.fn()}
            onCreateProject={vi.fn()}
          />
          <ProjectNavItem projectId="project-1" title="Alpha" shortcut="H" active />
          <SidebarNavItem
            to="/projects/project-1/versions/version-1/overview"
            label="Overview"
            icon={<Home size={15} />}
            shortcut="1"
            active
          />
          <CreateVersionItem projectId="project-1" />
        </>
      </MemoryRouter>
    );
  });

  it('renders version navigation without accessibility violations', async () => {
    await expectNoA11yViolations(
      <MemoryRouter>
        <VersionRow
          version={project.versions[0]}
          projectId="project-1"
          isSelected
          isKeyFocused={false}
        />
      </MemoryRouter>
    );
  });

  it('renders project list items without accessibility violations', async () => {
    await expectNoA11yViolations(
      <MemoryRouter>
        <>
          <ProjectDropdownItem
            project={projectList[0]}
            isActive
            onNavigate={vi.fn()}
            onEditProject={vi.fn()}
            onCloseDropdown={vi.fn()}
          />
          <ProjectVersionsNav
            projectId="project-1"
            versions={project.versions}
            currentVersionId="version-1"
            keyFocusedIndex={0}
          />
          <SidebarNavItem
            to="/projects/project-1/versions/version-1/overview"
            label="Overview"
            icon={<Search size={15} />}
            collapsed
            active={false}
          />
        </>
      </MemoryRouter>
    );
  });
});
