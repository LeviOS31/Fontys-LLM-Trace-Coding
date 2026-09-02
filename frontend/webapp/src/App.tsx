import { Route, Routes } from 'react-router';
import { AppLayout } from './components/AppLayout.tsx';
import { Suspense } from 'react';
import * as React from 'react';

const HomePage = React.lazy(() => import('./feature/home/HomePage.tsx'));
const TracesPage = React.lazy(() => import('./feature/traces/TracesPage.tsx'));
const ProjectPage = React.lazy(() => import('./feature/projects/ProjectPage.tsx'));
const OverviewPage = React.lazy(() => import('./feature/overview/OverviewPage.tsx'));
const OpenCodePage = React.lazy(() => import('./feature/opencode/OpenCodePage.tsx'));
const AxialCodePage = React.lazy(() => import('./feature/axialcode/AxialCodePage.tsx'));
const JudgeTemplatePage = React.lazy(() => import('./feature/judgeTemplate/JudgeTemplatePage.tsx'));
const TraceGroupPage = React.lazy(() => import('./feature/opencode/traceGroup/TraceGroupPage.tsx'));
const NotFoundPage = React.lazy(() => import('./shared/components/NotFoundPage.tsx'));

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route
          path="/"
          element={
            <Suspense fallback={null}>
              <HomePage />
            </Suspense>
          }
        />
        <Route
          path="/traces"
          element={
            <Suspense fallback={null}>
              <TracesPage />
            </Suspense>
          }
        />
        <Route
          path="/projects/:id"
          element={
            <Suspense fallback={null}>
              <ProjectPage />
            </Suspense>
          }
        />
        <Route
          path="/projects/:id/versions/:versionId/overview"
          element={
            <Suspense fallback={null}>
              <OverviewPage />
            </Suspense>
          }
        />
        <Route
          path="/projects/:id/versions/:versionId/open-code"
          element={
            <Suspense fallback={null}>
              <OpenCodePage />
            </Suspense>
          }
        />
        <Route
          path="/projects/:id/versions/:versionId/open-code/:traceGroupId"
          element={
            <Suspense fallback={null}>
              <TraceGroupPage />
            </Suspense>
          }
        />
        <Route
          path="/projects/:id/versions/:versionId/axial-code"
          element={
            <Suspense fallback={null}>
              <AxialCodePage />
            </Suspense>
          }
        />
        <Route
          path="/projects/:id/versions/:versionId/judge-template"
          element={
            <Suspense fallback={null}>
              <JudgeTemplatePage />
            </Suspense>
          }
        />
        <Route
          path="*"
          element={
            <Suspense fallback={null}>
              <NotFoundPage />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
