describe('open code', () => {
  const projectId = 'de802ddc-d47a-426b-9ce5-f7b81fec0a49';
  const versionId = 'cc6c86c0-8db4-4b77-95d0-3f5d8e6a2d02';

  const traceGroupId = '00000000-1111-2222-3333-000000000011';
  const traceId = '03300000-1111-2222-3333-000000000011';

  const project = {
    projectId,
    name: 'Open Code Test Project',
    description: 'Project for open code e2e tests',
    userId: 'EC1145A3-869D-4B06-B4AE-7308D85839B7',
  };

  const version = {
    versionId,
    projectId,
    name: 'Test Version',
    description: 'Version for open code e2e tests',
  };

  const collection = {
    traceCollectionId: '00000000-1111-2222-3333-000000000010',
    projectVersionId: versionId,
    name: 'Collection 1',
    createdAt: new Date().toISOString(),
    traces: [
      {
        traceGroupId,
        traceId,
        traceCollectionId: '00000000-1111-2222-3333-000000000010',

        traceResources: [{ key: 'service.name', value: 'Test Service', attributeType: 0 }],

        traceScopes: [
          {
            scopeId: '00000000-1111-2222-3333-000000000020',
            name: 'Test Scope',
            version: '1.0.0',
            spans: [
              {
                spanId: '00000000-1111-2222-3333-000000000030',
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
      },
    ],
  };

  // The open code editor lives on the trace group detail page. With a single trace in
  // the group it is auto-selected, so the open code panel renders immediately.
  const visitTraceGroup = () =>
    cy.visit(`/projects/${projectId}/versions/${versionId}/open-code/${traceGroupId}`);

  const getOpenCodeTextarea = () => cy.get('textarea[placeholder="Add open code for this trace…"]');

  const seedBase = () => {
    cy.task('seedProjects', [project]);
    cy.task('seedVersions', [version]);
    cy.task('seedTraces', [collection]);
  };

  // ---------------------------------------------------------------------------
  // Scenario 1: Trace with no existing open code
  // ---------------------------------------------------------------------------
  context('given a trace with no existing open code', () => {
    beforeEach(() => {
      seedBase();
      visitTraceGroup();
    });

    it('shows an empty textarea', () => {
      getOpenCodeTextarea().should('have.value', '');
    });

    it('shows unsaved changes badge immediately after typing', () => {
      getOpenCodeTextarea().type('new open code');
      cy.contains('Unsaved changes').should('be.visible');
    });

    it('saves after debounce and shows saved badge', () => {
      getOpenCodeTextarea().type('my open code');
      cy.contains('Saved', { timeout: 5000 }).should('be.visible');
    });

    it('persists the saved open code after a reload', () => {
      getOpenCodeTextarea().type('persisted open code');
      cy.contains('Saved', { timeout: 5000 }).should('be.visible');

      visitTraceGroup();
      getOpenCodeTextarea().should('have.value', 'persisted open code');
    });
  });

  // ---------------------------------------------------------------------------
  // Scenario 2: Trace with an existing open code
  // ---------------------------------------------------------------------------
  context('given a trace with an existing open code', () => {
    const existingOpenCode = 'existing open code value';

    beforeEach(() => {
      seedBase();
      cy.task('seedOpenCodes', [
        {
          openCodeId: 'cccccccc-0000-0000-0000-000000000001',
          traceId,
          openCodeValue: existingOpenCode,
        },
      ]);
      visitTraceGroup();
    });

    it('loads the existing open code into the textarea', () => {
      getOpenCodeTextarea().should('have.value', existingOpenCode);
    });

    it('shows unsaved changes badge immediately after editing', () => {
      getOpenCodeTextarea().clear().type('updated value');
      cy.contains('Unsaved changes').should('be.visible');
    });

    it('saves the updated value after debounce and shows saved badge', () => {
      getOpenCodeTextarea().clear().type('updated open code');
      cy.contains('Saved', { timeout: 5000 }).should('be.visible');
    });
  });
});
