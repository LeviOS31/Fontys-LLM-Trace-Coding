describe('trace group viewing', () => {
  const projectId = 'de802ddc-d47a-426b-9ce5-f7b81fec0a49';
  const versionId = 'cc6c86c0-8db4-4b77-95d0-3f5d8e6a2d02';

  const traceGroupId = '00000000-1111-2222-3333-000000000011';
  const traceId = '03300000-1111-2222-3333-000000000011';

  const axialResultId = 'aaaaaaaa-0000-0000-0000-000000000001';
  const axialCodeId = 'bbbbbbbb-0000-0000-0000-000000000001';

  const project = {
    projectId,
    name: 'Trace Group Test Project',
    description: 'Project for trace group e2e tests',
    userId: 'EC1145A3-869D-4B06-B4AE-7308D85839B7',
  };

  const version = {
    versionId,
    projectId,
    name: 'Test Version',
    description: 'Version for trace group e2e tests',
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
                events: [
                  {
                    eventId: '00000000-1111-2222-3333-000000000040',
                    timeUnixNano: Date.now() * 1_000_000,
                    name: 'RequestStarted',
                    attributes: [{ key: 'endpoint', value: '/api/test', attributeType: 0 }],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };

  const openCode = {
    openCodeId: 'cccccccc-0000-0000-0000-000000000001',
    traceId,
    openCodeValue: 'Trace was confusing to the user',
  };

  // An axial code that references the seeded trace. CreatedAt drives the "needs update"
  // warning: it is compared against the trace's UpdatedAt (set to "now" when seeded).
  const buildAxialResult = (createdAt: string) => ({
    axialCodingResultId: axialResultId,
    projectVersionId: versionId,
    isActive: true,
    createdAt,
    axialCodes: [
      {
        axialCodeId,
        label: 'Usability Issues',
        description: 'Navigation and UX problems',
        traceIds: [traceId],
      },
    ],
  });

  // Generated long before the trace's last open-code edit → axial codes are out of date.
  const AXIAL_OUT_OF_DATE = '2000-01-01T00:00:00.000Z';
  // Generated long after the trace's last open-code edit → axial codes are up to date.
  const AXIAL_UP_TO_DATE = '2999-01-01T00:00:00.000Z';

  const seedBase = () => {
    cy.task('seedProjects', [project]);
    cy.task('seedVersions', [version]);
    cy.task('seedTraces', [collection]);
    cy.task('seedOpenCodes', [openCode]);
  };

  const visitOverview = () => cy.visit(`/projects/${projectId}/versions/${versionId}/open-code`);

  const visitTraceGroup = () =>
    cy.visit(`/projects/${projectId}/versions/${versionId}/open-code/${traceGroupId}`);

  // ---------------------------------------------------------------------------
  // Trace group overview (master list)
  // ---------------------------------------------------------------------------
  context('trace group overview list', () => {
    it('lists the group with trace, span and open-code counts', () => {
      seedBase();
      visitOverview();

      cy.contains('Test Scope').should('be.visible');
      cy.contains('1 Trace').should('be.visible');
      cy.contains('1 Span').should('be.visible');
      cy.contains('1 Open code').should('be.visible');
    });

    it('shows no axial-code badge when the group is not part of any axial code', () => {
      seedBase();
      visitOverview();

      cy.contains('Test Scope').should('be.visible');
      cy.contains('1 Axial code').should('not.exist');
      cy.contains('Needs update').should('not.exist');
    });

    it('shows the axial-code count badge without a warning when the axial codes are up to date', () => {
      seedBase();
      cy.task('seedAxialCodingResults', [buildAxialResult(AXIAL_UP_TO_DATE)]);
      visitOverview();

      cy.contains('1 Axial code').should('be.visible');
      cy.contains('Needs update').should('not.exist');
    });

    it('warns that the axial codes need updating when a trace changed after they were generated', () => {
      seedBase();
      cy.task('seedAxialCodingResults', [buildAxialResult(AXIAL_OUT_OF_DATE)]);
      visitOverview();

      cy.contains('1 Axial code').should('be.visible');
      cy.contains('Needs update').should('be.visible');
    });
  });

  // ---------------------------------------------------------------------------
  // Trace group detail page + the trace itself
  // ---------------------------------------------------------------------------
  context('trace group detail page', () => {
    it('renders the selected trace with its id and span', () => {
      seedBase();
      visitTraceGroup();

      cy.contains(traceId).should('be.visible');
      cy.contains('Test Span').should('be.visible');
    });

    it('shows no axial-code badges when the trace is not part of any axial code', () => {
      seedBase();
      visitTraceGroup();

      cy.contains(traceId).should('be.visible');
      cy.contains('Axial coded').should('not.exist');
      cy.contains('Needs update').should('not.exist');
    });

    it('shows the axial-coded badge and group summary when the trace is part of an up-to-date axial code', () => {
      seedBase();
      cy.task('seedAxialCodingResults', [buildAxialResult(AXIAL_UP_TO_DATE)]);
      visitTraceGroup();

      cy.contains('Axial coded').should('be.visible');
      cy.contains('Needs update').should('not.exist');
    });

    it('warns that the axial codes need updating when the trace changed after they were generated', () => {
      seedBase();
      cy.task('seedAxialCodingResults', [buildAxialResult(AXIAL_OUT_OF_DATE)]);
      visitTraceGroup();

      cy.contains('Axial coded').should('be.visible');
      cy.contains('Needs update').should('be.visible');
    });
  });
});
