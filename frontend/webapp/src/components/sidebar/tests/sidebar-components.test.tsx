import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Home, Search } from 'lucide-react';
import type { PropsWithChildren, ReactNode } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import type { Project } from '../../../shared/types/project.ts';

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
        <button
          type="button"
          onClick={() => onSelect?.({ preventDefault: () => {} })}
          style={{ display: 'block', width: '100%' }}
        >
          {children}
        </button>
      ),
    },
  };
});

const projectList: Omit<Project, 'versions'>[] = [
  {
    projectId: 'project-1',
    userId: 'user-1',
    name: 'Alpha',
    description: 'Alpha project',
    assessmentCriteria: [],
  },
];

const project: Project = {
  ...projectList[0],
  versions: [
    {
      versionId: 'version-1',
      projectId: 'project-1',
      name: 'Initial analysis',
      description: 'First pass',
    },
  ],
  assessmentCriteria: [],
};

const { useGetAllProjects, useGetProject } = vi.hoisted(() => ({
  useGetAllProjects: vi.fn(),
  useGetProject: vi.fn(),
}));

vi.mock('../../../feature/projects/hooks/useGetAllProjects.ts', () => ({ useGetAllProjects }));
vi.mock('../../../feature/projects/hooks/useGetProject.ts', () => ({ useGetProject }));
vi.mock('../../../feature/projects/components/CreateProjectModal.tsx', () => ({
  default: ({ open }: { open: boolean }) => (open ? <div>create project modal</div> : null),
}));
vi.mock('../../../feature/projects/components/EditProjectModal.tsx', () => ({
  default: ({ open }: { open: boolean }) => (open ? <div>edit project modal</div> : null),
}));
vi.mock('../../../feature/versions/components/CreateVersionModal', () => ({
  CreateVersionModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div>Create version modal</div> : null,
}));
vi.mock('../../../feature/settings/components/LlmStatusIndicator.tsx', () => ({
  LlmStatusIndicator: ({ collapsed }: { collapsed?: boolean }) => (
    <div>{collapsed ? 'LLM collapsed' : 'LLM status'}</div>
  ),
}));

import { CreateVersionItem } from '../CreateVersionItem.tsx';
import { ProjectDropdownItem } from '../ProjectDropdownItem.tsx';
import { ProjectNavItem } from '../ProjectNavItem.tsx';
import { ProjectSelector } from '../ProjectSelector.tsx';
import { ProjectVersionsNav } from '../ProjectVersionsNav.tsx';
import { ProjectsNavHeader, ProjectsNavVersions } from '../ProjectsNav.tsx';
import { ScrollbarThumb } from '../ScrollbarThumb.tsx';
import { SidebarNavItem } from '../SidebarNavItem.tsx';
import { Sidebar } from '../../Sidebar.tsx';
import { VersionRow } from '../VersionRow.tsx';

describe('ProjectSelector', () => {
  it('renders the current project in the selector trigger', () => {
    render(
      <MemoryRouter>
        <ProjectSelector
          isLoading={false}
          projects={projectList}
          currentProjectId="project-1"
          onEditProject={vi.fn()}
          onCreateProject={vi.fn()}
        />
      </MemoryRouter>
    );

    const trigger = screen.getByTestId('project-selector');
    expect(trigger).toBeInTheDocument();
    expect(screen.getAllByText('Alpha').length).toBeGreaterThan(0);
    fireEvent.click(trigger);
    expect(screen.getAllByText('Alpha').length).toBeGreaterThan(0);
  });

  it('renders a compact trigger when collapsed', () => {
    render(
      <MemoryRouter>
        <ProjectSelector
          collapsed
          isLoading={false}
          projects={projectList}
          currentProjectId="project-1"
          onEditProject={vi.fn()}
          onCreateProject={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByTestId('project-selector')).toBeInTheDocument();
  });
});

describe('ProjectDropdownItem', () => {
  it('navigates to the project and opens the edit action', () => {
    const onNavigate = vi.fn();
    const onEditProject = vi.fn();
    const onCloseDropdown = vi.fn();

    render(
      <MemoryRouter>
        <ProjectDropdownItem
          project={projectList[0]}
          isActive
          onNavigate={onNavigate}
          onEditProject={onEditProject}
          onCloseDropdown={onCloseDropdown}
        />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Alpha'));
    expect(onNavigate).toHaveBeenCalledWith('project-1');

    fireEvent.pointerDown(screen.getByLabelText('Edit project'));
    fireEvent.click(screen.getByLabelText('Edit project'));
    expect(onCloseDropdown).toHaveBeenCalledTimes(1);
    expect(onEditProject).toHaveBeenCalledWith(projectList[0]);
  });
});

describe('ProjectNavItem', () => {
  it('renders the project link and shortcut when expanded', () => {
    render(
      <MemoryRouter>
        <ProjectNavItem projectId="project-1" title="Alpha" shortcut="H" active={false} />
      </MemoryRouter>
    );

    const link = screen.getByRole('link', { name: /Alpha/i });
    expect(link).toHaveAttribute('href', '/projects/project-1');
    expect(screen.getByText('H')).toBeInTheDocument();
  });
});

describe('CreateVersionItem', () => {
  it('opens the modal when clicked in the expanded state', () => {
    render(
      <MemoryRouter>
        <CreateVersionItem projectId="project-1" />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /New version/i }));
    expect(screen.getByText('Create version modal')).toBeInTheDocument();
  });

  it('shows a compact trigger when collapsed', () => {
    render(
      <MemoryRouter>
        <CreateVersionItem collapsed projectId="project-1" />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: 'New version' })).toBeInTheDocument();
  });
});

describe('ScrollbarThumb', () => {
  it('renders when the container is scrollable', () => {
    const container = document.createElement('div');
    Object.defineProperty(container, 'scrollHeight', { value: 200, configurable: true });
    Object.defineProperty(container, 'clientHeight', { value: 100, configurable: true });
    Object.defineProperty(container, 'scrollTop', { value: 50, configurable: true });

    render(<ScrollbarThumb containerRef={{ current: container }} />);

    expect(document.querySelector('[style*="position: absolute"]')).toBeInTheDocument();
  });
});

describe('SidebarNavItem', () => {
  it('renders the label, shortcut, and active state', () => {
    render(
      <MemoryRouter>
        <SidebarNavItem
          to="/projects/project-1/versions/version-1/overview"
          label="Overview"
          icon={<Home size={15} />}
          shortcut="1"
          active
        />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /Overview/i })).toHaveAttribute(
      'href',
      '/projects/project-1/versions/version-1/overview'
    );
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('renders a compact icon-only link when collapsed', () => {
    render(
      <MemoryRouter>
        <SidebarNavItem
          to="/projects/project-1/versions/version-1/overview"
          label="Overview"
          icon={<Search size={15} />}
          collapsed
          active={false}
        />
      </MemoryRouter>
    );

    expect(screen.getAllByRole('link')[0]).toBeInTheDocument();
  });
});

describe('ProjectVersionsNav', () => {
  it('renders the version header and list', () => {
    render(
      <MemoryRouter>
        <ProjectVersionsNav
          projectId="project-1"
          versions={project.versions}
          currentVersionId="version-1"
          keyFocusedIndex={0}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Versions')).toBeInTheDocument();
    expect(screen.getByText('Initial analysis')).toBeInTheDocument();
  });
});

describe('VersionRow', () => {
  it('navigates to the overview page and reveals subpages when selected', () => {
    function LocationProbe() {
      const location = useLocation();
      return <div data-testid="location">{location.pathname}</div>;
    }

    render(
      <MemoryRouter initialEntries={['/projects/project-1']}>
        <Routes>
          <Route
            path="*"
            element={
              <>
                <LocationProbe />
                <VersionRow version={project.versions[0]} projectId="project-1" isSelected />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Overview')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Initial analysis/i }));
    expect(screen.getByTestId('location')).toHaveTextContent('/projects/project-1/versions/version-1/overview');
  });
});

describe('ProjectsNavHeader', () => {
  it('shows the active project link and loads the current project details', () => {
    useGetAllProjects.mockReturnValue({ data: { projects: projectList }, isLoading: false });
    useGetProject.mockReturnValue({ data: project, isLoading: false, error: undefined });

    render(
      <MemoryRouter initialEntries={['/projects/project-1']}>
        <Routes>
          <Route path="/projects/:id" element={<ProjectsNavHeader />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getAllByText('Alpha').length).toBeGreaterThan(0);
  });
});

describe('ProjectsNavVersions', () => {
  it('renders the project versions when the project is loaded', () => {
    useGetAllProjects.mockReturnValue({ data: { projects: projectList }, isLoading: false });
    useGetProject.mockReturnValue({ data: project, isLoading: false, error: undefined });

    render(
      <MemoryRouter initialEntries={['/projects/project-1/versions/version-1/overview']}>
        <Routes>
          <Route path="/projects/:id/versions/:versionId/*" element={<ProjectsNavVersions />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Initial analysis')).toBeInTheDocument();
  });
});

describe('Sidebar', () => {
  it('collapses and expands the sidebar state', () => {
    useGetAllProjects.mockReturnValue({ data: { projects: projectList }, isLoading: false });
    useGetProject.mockReturnValue({ data: project, isLoading: false, error: undefined });

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    expect(screen.getByText('TraceEval')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
    expect(screen.queryByText('TraceEval')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Open sidebar' }));
    expect(screen.getByText('TraceEval')).toBeInTheDocument();
  });
});
