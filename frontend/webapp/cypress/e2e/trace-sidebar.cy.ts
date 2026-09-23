describe('trace sidebar', () => {
  const projectId = 'de802ddc-d47a-426b-9ce5-f7b81fec0a49';
  const versionId = 'cc6c86c0-8db4-4b77-95d0-3f5d8e6a2d02';

  const alphaGroupId = '00000000-1111-2222-3333-000000000011';
  const alphaTraceId = '03300000-1111-2222-3333-000000000011';
  // The alpha group holds two traces so switching trace within a group can be tested.
  const alphaSecondTraceId = '03300000-1111-2222-3333-000000000013';
  const betaGroupId = '00000000-1111-2222-3333-000000000012';
  const betaTraceId = '03300000-1111-2222-3333-000000000012';

  const alphaTitle = 'Alpha Scope';
  const betaTitle = 'Beta Scope';

  const project = {
    projectId,
    name: 'Trace Sidebar Test Project',
    description: 'Project for trace sidebar e2e tests',
    userId: 'EC1145A3-869D-4B06-B4AE-7308D85839B7',
  };

  const version = {
    versionId,
    projectId,
    name: 'Test Version',
    description: 'Version for trace sidebar e2e tests',
  };

  const collectionId = '00000000-1111-2222-3333-000000000010';

  const buildTrace = (
    traceId: string,
    traceGroupId: string,
    scopeId: string,
    scopeName: string,
    spanId: string
  ) => ({
    traceGroupId,
    traceId,
    traceCollectionId: collectionId,

    traceResources: [{ key: 'service.name', value: 'Test Service', attributeType: 0 }],

    traceScopes: [
      {
        scopeId,
        name: scopeName,
        version: '1.0.0',
        spans: [
          {
            spanId,
            parentSpanId: null,
            name: 'Test Span',
            startTimeUnixNano: Date.now() * 1_000_000,
            endTimeUnixNano: (Date.now() + 1000) * 1_000_000,
            spanKind: 1,
            attributes: [{ key: 'http.method', value: 'GET', attributeType: 0 }],
            events: [],
          },
        ],
      },
    ],
  });

  const collection = {
    traceCollectionId: collectionId,
    projectVersionId: versionId,
    name: 'Collection 1',
    createdAt: new Date().toISOString(),
    traces: [
      buildTrace(
        alphaTraceId,
        alphaGroupId,
        '00000000-1111-2222-3333-000000000020',
        alphaTitle,
        '00000000-1111-2222-3333-000000000030'
      ),
      // Same scope name as the first alpha trace, so the group title stays the
      // same whichever trace the API returns first.
      buildTrace(
        alphaSecondTraceId,
        alphaGroupId,
        '00000000-1111-2222-3333-000000000022',
        alphaTitle,
        '00000000-1111-2222-3333-000000000032'
      ),
      buildTrace(
        betaTraceId,
        betaGroupId,
        '00000000-1111-2222-3333-000000000021',
        betaTitle,
        '00000000-1111-2222-3333-000000000031'
      ),
    ],
  };

  const seedBase = () => {
    cy.task('seedProjects', [project]);
    cy.task('seedVersions', [version]);
    cy.task('seedTraces', [collection]);
  };

  const visitOpenCode = () => cy.visit(`/projects/${projectId}/versions/${versionId}/open-code`);

  const sidebar = () => cy.get('aside[aria-label="Traces"]');
  const sidebarItems = () => cy.get('[data-testid="trace-sidebar-item"]');
  const activeItem = () => cy.get('[data-testid="trace-sidebar-item"][aria-current="page"]');

  beforeEach(() => {
    seedBase();
    visitOpenCode();
  });

  // ---------------------------------------------------------------------------
  // Listing
  // ---------------------------------------------------------------------------
  context('with no trace group selected', () => {
    it('lists every trace group of the version', () => {
      sidebar().contains(alphaTitle).should('be.visible');
      sidebar().contains(betaTitle).should('be.visible');
    });

    it('asks the user to pick a trace group', () => {
      cy.contains('Select a trace group in the sidebar to start coding.').should('be.visible');
      activeItem().should('not.exist');
    });
  });

  // ---------------------------------------------------------------------------
  // Switching
  // ---------------------------------------------------------------------------
  context('switching between trace groups', () => {
    it('opens a trace group and keeps the sidebar visible', () => {
      sidebar().contains(alphaTitle).click();

      cy.location('pathname', { timeout: 10000 }).should('include', `/open-code/${alphaGroupId}`);
      sidebar().contains(betaTitle).should('be.visible');
      activeItem().should('contain.text', alphaTitle);
    });

    it('switches to another trace group without going back to a list page', () => {
      sidebar().contains(alphaTitle).click();
      cy.location('pathname', { timeout: 10000 }).should('include', `/open-code/${alphaGroupId}`);

      sidebar().contains(betaTitle).click();

      cy.location('pathname', { timeout: 10000 }).should('include', `/open-code/${betaGroupId}`);
      activeItem().should('contain.text', betaTitle);
      activeItem().should('not.contain.text', alphaTitle);
    });

    it('moves between trace groups with the arrow keys', () => {
      sidebarItems().eq(0).click();
      sidebarItems().eq(0).should('have.attr', 'aria-current', 'page');
      cy.location('pathname', { timeout: 10000 }).should('include', '/open-code/');

      cy.get('body').type('{rightarrow}');
      sidebarItems().eq(1).should('have.attr', 'aria-current', 'page');

      cy.get('body').type('{leftarrow}');
      sidebarItems().eq(0).should('have.attr', 'aria-current', 'page');
    });
  });

  // ---------------------------------------------------------------------------
  // Traces inside a group
  // ---------------------------------------------------------------------------
  context('switching between traces of a group', () => {
    const traceRows = () => cy.get('[data-testid="trace-sidebar-trace"]');
    const groupOf = (title: string) =>
      cy.contains('[data-testid="trace-sidebar-group"]', title, { timeout: 10000 });

    it('expands the open group and lists its traces', () => {
      sidebar().contains(alphaTitle).click();
      cy.location('pathname', { timeout: 10000 }).should('include', `/open-code/${alphaGroupId}`);

      groupOf(alphaTitle).find('[data-testid="trace-sidebar-trace"]').should('have.length', 2);
    });

    it('names the selected trace in the URL', () => {
      sidebar().contains(alphaTitle).click();
      traceRows().should('have.length', 2);

      traceRows().eq(1).click();

      cy.location('search', { timeout: 10000 }).should('include', 'traceId=');
      traceRows().eq(1).should('have.attr', 'aria-current', 'true');
      traceRows().eq(0).should('not.have.attr', 'aria-current');
    });

    it('opens a trace of another group in one click', () => {
      sidebar().contains(alphaTitle).click();
      cy.location('pathname', { timeout: 10000 }).should('include', `/open-code/${alphaGroupId}`);

      cy.get(`button[aria-label="Expand ${betaTitle}"]`).click();
      groupOf(betaTitle).find('[data-testid="trace-sidebar-trace"]').first().click();

      cy.location('pathname', { timeout: 10000 }).should('include', `/open-code/${betaGroupId}`);
      cy.location('search').should('include', 'traceId=');
    });

    it('drops the previous trace when switching to another group', () => {
      sidebar().contains(alphaTitle).click();
      traceRows().should('have.length', 2);
      traceRows().eq(1).click();
      cy.location('search', { timeout: 10000 }).should('include', 'traceId=');

      sidebar().contains(betaTitle).click();

      cy.location('pathname', { timeout: 10000 }).should('include', `/open-code/${betaGroupId}`);
      cy.location('search').should('not.include', 'traceId=');
    });
  });

  // ---------------------------------------------------------------------------
  // Collapsing
  // ---------------------------------------------------------------------------
  context('collapsing the sidebar', () => {
    it('hides and restores the trace list', () => {
      cy.get('button[aria-label="Collapse trace list"]').click();
      sidebarItems().should('not.exist');

      cy.get('button[aria-label="Expand trace list"]').click();
      sidebarItems().should('have.length', 2);
    });
  });
});
