describe('overview page', () => {
  const project = {
    projectId: 'ee901ddc-d47a-426b-9ce5-f7b81fec0a50',
    name: 'Overview Test Project',
    userId: 'EC1145A3-869D-4B06-B4AE-7308D85839B7',
    description: 'Project used for overview e2e',
  };

  const projectVersion = {
    versionId: 'cc6c86c0-8db4-4b77-95d0-3f5d8e6a2d02',
    projectId: project.projectId,
    name: 'v1.0.0',
    description: 'Initial release',
  };

  const collections = [
    {
      traceCollectionId: '00000000-1111-2222-3333-000000000010',
      projectVersionId: 'cc6c86c0-8db4-4b77-95d0-3f5d8e6a2d02',
      name: 'Collection 1',
      createdAt: new Date().toISOString(),
      traces: [
        {
          traceGroupId: '00000000-1111-2222-3333-000000000011',

          traceId: '03300000-1111-2222-3333-000000000011',
          traceCollectionId: '00000000-1111-2222-3333-000000000010',

          traceMessages: [
            {
              traceMessageType: 0,
              index: 0,
              role: 'user',
              content: 'Hello world',
            },
          ],

          traceResources: [
            {
              key: 'service.name',
              value: 'Test Service',
              attributeType: 0,
            },
          ],

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

                  attributes: [
                    {
                      key: 'http.method',
                      value: 'GET',
                      attributeType: 0,
                    },
                  ],

                  events: [
                    {
                      eventId: '00000000-1111-2222-3333-000000000040',
                      timeUnixNano: Date.now() * 1_000_000,
                      name: 'RequestStarted',

                      attributes: [
                        {
                          key: 'endpoint',
                          value: '/api/test',
                          attributeType: 0,
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ];
  const visitOverviewPage = () => {
    cy.visit(`/projects/${project.projectId}/versions/${projectVersion.versionId}/overview`);
  };

  beforeEach(() => {
    cy.task('seedProjects', [project]);
    cy.task('seedVersions', [projectVersion]);
    cy.task('seedTraces', collections);
    visitOverviewPage();
  });

  // ---------------------------------------------------------------------------
  // Display
  // ---------------------------------------------------------------------------
  context('collections list', () => {
    it('shows the Collections heading', () => {
      cy.contains('Collections').should('be.visible');
    });

    it('displays all collection names', () => {
      cy.contains('Collection 1').should('be.visible');
    });

    it('displays the correct trace count for each collection', () => {
      cy.contains('1 traces').should('be.visible');
    });

    it('shows an import date for each collection', () => {
      cy.contains('Imported').should('be.visible');
    });
  });

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------
});
