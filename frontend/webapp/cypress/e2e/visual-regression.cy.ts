const project = {
  projectId: 'de802ddc-d47a-426b-9ce5-f7b81fec0a49',
  name: 'Visual Regression Project',
  userId: 'EC1145A3-869D-4B06-B4AE-7308D85839B7',
  description: 'Stable project data for frontend visual regression tests.',
  assessmentCriteria: [],
  versions: [
    {
      versionId: 'cc6c86c0-8db4-4b77-95d0-3f5d8e6a2d02',
      projectId: 'de802ddc-d47a-426b-9ce5-f7b81fec0a49',
      name: 'Visual Test Version',
      description: 'Stable version data for visual regression tests.',
    },
  ],
};

const projectPath = `/projects/${project.projectId}`;
const versionPath = `${projectPath}/versions/${project.versions[0].versionId}`;

function prepareStableScreenshot() {
  cy.viewport(1280, 720);
  cy.document().then((document) => {
    const style = document.createElement('style');
    style.dataset.visualRegression = 'true';
    style.textContent = `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        caret-color: transparent !important;
        scroll-behavior: auto !important;
        transition-duration: 0s !important;
      }
    `;
    document.head.appendChild(style);
    return document.fonts.ready;
  });
}

function captureAndCompare(name: string) {
  prepareStableScreenshot();
  cy.screenshot(`visual-regression/${name}`, {
    capture: 'viewport',
    disableTimersAndAnimations: true,
    overwrite: true,
  });

  cy.task<{ updated: boolean; mismatchRatio: number }>('compareVisualSnapshot', { name }).then(
    ({ updated, mismatchRatio }) => {
      if (updated) return;
      expect(
        mismatchRatio,
        `Visual difference for "${name}" exceeded the 1% tolerance; inspect cypress/visual-diffs`
      ).to.be.at.most(0.01);
    }
  );
}

describe('frontend visual regression', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/v1/**', (request) => {
      const pathname = new URL(request.url).pathname;
      let body: unknown;

      if (pathname === '/v1/projects') {
        body = { projects: [project] };
      } else if (pathname === `/v1/projects/${project.projectId}`) {
        body = project;
      } else if (pathname.endsWith('/traces/collections')) {
        body = { traceCollections: [] };
      } else if (pathname.endsWith('/statistics')) {
        body = pathname.endsWith(`/versions/${project.versions[0].versionId}/statistics`)
          ? {
              versionTraceCount: 0,
              versionOpenCodeCount: 0,
              versionAxialCodeCount: 0,
              versionAxialCodes: [],
            }
          : {
              totalTraceCount: 0,
              versionTotalTraceCount: {},
              totalOpenCodeCount: 0,
              totalAxialCodeCount: 0,
              versionAxialCodes: {},
            };
      } else if (pathname.endsWith('/opencodes')) {
        body = { opencodes: [] };
      } else if (pathname.endsWith('/axial-coding-results/current')) {
        body = { axialCodes: [], createdAt: null };
      } else if (pathname.endsWith('/judge-templates')) {
        body = { judgeTemplates: [] };
      } else if (pathname.endsWith('/settings/llm/status')) {
        body = { providerName: 'Local', modelName: 'test', isConnected: false };
      } else if (pathname.endsWith('/settings/llm/default-config')) {
        body = { providerName: 'Local', endpoint: 'http://localhost', modelName: 'test' };
      } else if (pathname.includes('/traces')) {
        body = { page: 1, hasNextPage: false, totalCount: 0, items: [] };
      } else {
        request.reply({ statusCode: 501, body: { error: `Unmocked visual API: ${pathname}` } });
        return;
      }

      request.reply({ statusCode: 200, body });
    });
  });

  it('matches the home page', () => {
    cy.visit('/');
    cy.contains('h1', 'SELECT A PROJECT').should('be.visible');
    cy.get('[data-testid="project-selector"]').should('contain.text', 'Select a project');
    captureAndCompare('home');
  });

  it('matches the home page with the sidebar collapsed', () => {
    cy.visit('/');
    cy.contains('h1', 'SELECT A PROJECT').should('be.visible');
    cy.get('[aria-label="Collapse sidebar"]').click();
    cy.get('[aria-label="Open sidebar"]').should('be.visible');
    captureAndCompare('home-sidebar-collapsed');
  });

  it('matches the traces page', () => {
    cy.visit('/traces');
    cy.contains('h1', 'Version 1').should('be.visible');
    captureAndCompare('traces');
  });

  it('matches the project analytics page', () => {
    cy.visit(projectPath);
    cy.contains('Project Analytics').should('be.visible');
    cy.contains('Details').should('be.visible');
    captureAndCompare('project');
  });

  it('matches the version overview page', () => {
    cy.visit(`${versionPath}/overview`);
    cy.contains('Overview').should('be.visible');
    cy.contains('Collections').should('be.visible');
    captureAndCompare('overview');
  });

  it('matches the open coding empty state', () => {
    cy.visit(`${versionPath}/open-code`);
    cy.contains('Select a trace group in the sidebar to start coding.').should('be.visible');
    captureAndCompare('open-code-empty');
  });

  it('matches the axial coding page', () => {
    cy.visit(`${versionPath}/axial-code`);
    cy.contains('Axial Coding').should('be.visible');
    captureAndCompare('axial-code');
  });

  it('matches the judge templates page', () => {
    cy.visit(`${versionPath}/judge-template`);
    cy.contains('Judge Template').should('be.visible');
    cy.get('input[placeholder="Search judge templates…"]').should('be.visible');
    captureAndCompare('judge-template');
  });

  it('matches the not-found page', () => {
    cy.visit('/not-a-real-route');
    cy.contains('h1', '404 - Page Not Found').should('be.visible');
    captureAndCompare('not-found');
  });
});
