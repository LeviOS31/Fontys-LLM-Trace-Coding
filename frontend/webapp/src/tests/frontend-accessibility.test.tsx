import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { Theme } from '@radix-ui/themes';
import axe from 'axe-core';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppLayout } from '../components/AppLayout.tsx';
import HomePage from '../feature/home/HomePage.tsx';
import TracesPage from '../feature/traces/TracesPage.tsx';
import ProjectPage from '../feature/projects/ProjectPage.tsx';
import OverviewPage from '../feature/overview/OverviewPage.tsx';
import OpenCodeLayout from '../feature/opencode/OpenCodeLayout.tsx';
import OpenCodePage from '../feature/opencode/OpenCodePage.tsx';
import AxialCodePage from '../feature/axialcode/AxialCodePage.tsx';
import JudgeTemplatePage from '../feature/judgeTemplate/JudgeTemplatePage.tsx';
import TraceGroupPage from '../feature/opencode/traceGroup/TraceGroupPage.tsx';
import NotFoundPage from '../shared/components/NotFoundPage.tsx';

const {
  useGetProject,
  useGetTraceCollections,
  useGetCurrentAxialCodes,
  useGetOpenCodes,
  useSaveAxialCodes,
  useGetJudgeTemplates,
  useCreateJudgeTemplate,
  useDeleteJudgeTemplate,
  useUpdateJudgeTemplate,
  useRestoreJudgeTemplateVersion,
  useTraceGroup,
  useGetAllProjects,
} = vi.hoisted(() => ({
  useGetProject: vi.fn(),
  useGetTraceCollections: vi.fn(),
  useGetCurrentAxialCodes: vi.fn(),
  useGetOpenCodes: vi.fn(),
  useSaveAxialCodes: vi.fn(),
  useGetJudgeTemplates: vi.fn(),
  useCreateJudgeTemplate: vi.fn(),
  useDeleteJudgeTemplate: vi.fn(),
  useUpdateJudgeTemplate: vi.fn(),
  useRestoreJudgeTemplateVersion: vi.fn(),
  useTraceGroup: vi.fn(),
  useGetAllProjects: vi.fn(),
}));

vi.mock('../feature/projects/hooks/useGetProject.ts', () => ({ useGetProject }));
vi.mock('../feature/projects/hooks/useGetAllProjects.ts', () => ({ useGetAllProjects }));
vi.mock('../feature/settings/components/LlmStatusIndicator.tsx', () => ({
  LlmStatusIndicator: ({ collapsed }: { collapsed?: boolean }) => (
    <div>{collapsed ? 'LLM collapsed' : 'LLM status'}</div>
  ),
}));
vi.mock('../feature/opencode/hooks/useGetTraceCollections.ts', () => ({ useGetTraceCollections }));
vi.mock('../feature/axialcode/hooks/useGetCurrentAxialCodesOfVersion.ts', () => ({
  useGetCurrentAxialCodesOfVersion: useGetCurrentAxialCodes,
}));
vi.mock('../feature/axialcode/hooks/useGetOpenCodesByVersion.ts', () => ({
  useGetOpenCodesByVersion: useGetOpenCodes,
}));
vi.mock('../feature/axialcode/hooks/useSaveAxialCodingResults.ts', () => ({
  useSaveAxialCodingResults: useSaveAxialCodes,
}));
vi.mock('../feature/judgeTemplate/hooks/useGetJudgeTemplates.ts', () => ({
  useGetJudgeTemplates,
}));
vi.mock('../feature/judgeTemplate/hooks/useCreateJudgeTemplate.ts', () => ({
  useCreateJudgeTemplate,
}));
vi.mock('../feature/judgeTemplate/hooks/useDeleteJudgeTemplate.ts', () => ({
  useDeleteJudgeTemplate,
}));
vi.mock('../feature/judgeTemplate/hooks/useUpdateJudgeTemplate.ts', () => ({
  useUpdateJudgeTemplate,
}));
vi.mock('../feature/judgeTemplate/hooks/useRestoreJudgeTemplateVersion.ts', () => ({
  useRestoreJudgeTemplateVersion,
}));
vi.mock('../feature/opencode/../traces/hooks/useTraceGroup', () => ({ useTraceGroup }));

vi.mock('../feature/projects/components/ProjectDetailsCard.tsx', () => ({
  default: () => <section aria-label="Project details">Project details</section>,
}));
vi.mock('../feature/projects/components/ProjectAnalyticsCard/ProjectAnalyticsCard.tsx', () => ({
  default: () => <section aria-label="Project analytics">Project analytics</section>,
}));
vi.mock('../feature/overview/components/CollectionList.tsx', () => ({
  default: () => <section aria-label="Collections">Collections</section>,
}));
vi.mock('../feature/overview/components/StatisticsOverviewCard.tsx', () => ({
  default: () => <section aria-label="Statistics">Statistics</section>,
}));
vi.mock('../feature/overview/components/DetailsOverviewCard.tsx', () => ({
  default: () => <section aria-label="Version details">Version details</section>,
}));
vi.mock('../feature/versions/components/VersionPageHeader.tsx', () => ({
  VersionPageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
}));
vi.mock('../feature/axialcode/components/GenerateAxailCodesPanal/GenerateAxialCodesPanel.tsx', () => ({
  GenerateAxialCodesPanel: () => <section aria-label="Generate axial codes">Generate axial codes</section>,
}));
vi.mock('../feature/axialcode/components/InterpretationPanel/InterpretationPanel.tsx', () => ({
  default: () => <section aria-label="Interpretation">Interpretation</section>,
}));
vi.mock('../feature/axialcode/components/SnapshotSummaryCard.tsx', () => ({
  default: () => <section aria-label="Snapshot summary">Snapshot summary</section>,
}));
vi.mock('../feature/axialcode/components/AxialCodeList.tsx', () => ({
  default: () => <section aria-label="Axial codes">Axial codes</section>,
}));
vi.mock('../feature/axialcode/components/ChangesSection/ChangesSection.tsx', () => ({
  default: () => <section aria-label="Code changes">Code changes</section>,
}));
vi.mock('../shared/components/SnapshotTreemap.tsx', () => ({
  default: () => <section aria-label="Snapshot chart">Snapshot chart</section>,
}));
vi.mock('../feature/judgeTemplate/components/CreateTemplatePanel/CreateTemplatePanel.tsx', () => ({
  CreateTemplatePanel: () => <section aria-label="Create judge template">Create judge template</section>,
}));
vi.mock('../feature/judgeTemplate/components/JudgeTemplateList/JudgeTemplateList.tsx', () => ({
  JudgeTemplateList: () => <section aria-label="Judge templates">Judge templates</section>,
}));
vi.mock('../feature/opencode/components/TraceSidebar/TraceSidebar.tsx', () => ({
  default: () => <nav aria-label="Trace groups">Trace groups</nav>,
}));
vi.mock('../shared/components/CustomResizeHandle.tsx', () => ({
  default: () => <div aria-hidden="true" />,
}));
vi.mock('../feature/opencode/traceGroup/LLM/LlmContent.tsx', () => ({
  LlmContent: () => <section aria-label="LLM content">LLM content</section>,
}));
vi.mock('../feature/opencode/traceGroup/trace/TraceTreeNav.tsx', () => ({
  TraceTreeNav: () => <nav aria-label="Trace tree">Trace tree</nav>,
}));
vi.mock('../feature/opencode/traceGroup/trace/TraceContentOverview.tsx', () => ({
  TraceContentOverview: () => <section aria-label="Trace overview">Trace overview</section>,
}));

function renderRoute(path: string, routePath: string, page: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <Theme>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path={routePath} element={page} />
              <Route path="/404" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Theme>
  );
}

async function expectRouteHasNoA11yViolations(path: string, routePath: string, page: ReactNode) {
  const { container } = renderRoute(path, routePath, page);
  const results = await axe.run(container);
  expect(results.violations).toEqual([]);
}

describe('frontend route accessibility', () => {
  beforeEach(() => {
    const currentProject = {
      projectId: 'project-1',
      userId: 'user-1',
      name: 'Accessibility project',
      description: '',
      assessmentCriteria: [],
      versions: [
        {
          versionId: 'version-1',
          projectId: 'project-1',
          name: 'Version 1',
          description: '',
        },
      ],
    };
    useGetProject.mockReturnValue({ data: currentProject, isLoading: false });
    useGetAllProjects.mockReturnValue({
      data: { projects: [currentProject] },
      isLoading: false,
    });
    useGetTraceCollections.mockReturnValue({ data: [], isLoading: false });
    useGetCurrentAxialCodes.mockReturnValue({ data: undefined });
    useGetOpenCodes.mockReturnValue({ data: [] });
    useSaveAxialCodes.mockReturnValue({ mutate: vi.fn(), isPending: false });
    useGetJudgeTemplates.mockReturnValue({ data: { judgeTemplates: [] } });
    useCreateJudgeTemplate.mockReturnValue({ mutate: vi.fn(), isPending: false });
    useDeleteJudgeTemplate.mockReturnValue({ mutate: vi.fn() });
    useUpdateJudgeTemplate.mockReturnValue({ mutate: vi.fn(), isPending: false });
    useRestoreJudgeTemplateVersion.mockReturnValue({ mutate: vi.fn(), isPending: false });
    useTraceGroup.mockReturnValue({ data: { traceGroupType: 'TraceGroup', traces: [] }, isLoading: false, isError: false });
  });

  it('checks the home route', async () => {
    await expectRouteHasNoA11yViolations('/', '/', <HomePage />);
  });

  it('checks the traces route', async () => {
    await expectRouteHasNoA11yViolations('/traces', '/traces', <TracesPage />);
  });

  it('checks the project analytics route', async () => {
    await expectRouteHasNoA11yViolations('/projects/project-1', '/projects/:id', <ProjectPage />);
  });

  it('checks the version overview route', async () => {
    await expectRouteHasNoA11yViolations(
      '/projects/project-1/versions/version-1/overview',
      '/projects/:id/versions/:versionId/overview',
      <OverviewPage />
    );
  });

  it('checks the open coding route', async () => {
    await expectRouteHasNoA11yViolations(
      '/projects/project-1/versions/version-1/open-code',
      '/projects/:id/versions/:versionId/open-code',
      <OpenCodeLayout />
    );
  });

  it('checks the open coding empty state', async () => {
    await expectRouteHasNoA11yViolations(
      '/projects/project-1/versions/version-1/open-code',
      '/projects/:id/versions/:versionId/open-code',
      <OpenCodePage />
    );
  });

  it('checks the trace group route', async () => {
    await expectRouteHasNoA11yViolations(
      '/projects/project-1/versions/version-1/open-code/group-1',
      '/projects/:id/versions/:versionId/open-code/:traceGroupId',
      <TraceGroupPage />
    );
  });

  it('checks the axial coding route', async () => {
    await expectRouteHasNoA11yViolations(
      '/projects/project-1/versions/version-1/axial-code',
      '/projects/:id/versions/:versionId/axial-code',
      <AxialCodePage />
    );
  });

  it('checks the judge template route', async () => {
    await expectRouteHasNoA11yViolations(
      '/projects/project-1/versions/version-1/judge-template',
      '/projects/:id/versions/:versionId/judge-template',
      <JudgeTemplatePage />
    );
  });

  it('checks the not-found route', async () => {
    await expectRouteHasNoA11yViolations('/missing', '*', <NotFoundPage />);
  });
});
