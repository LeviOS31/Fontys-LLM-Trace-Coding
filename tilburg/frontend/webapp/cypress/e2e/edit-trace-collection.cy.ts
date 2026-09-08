describe('edit trace collection', () => {
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

  beforeEach(() => {
    cy.task('seedProjects', [project]);
    cy.task('seedVersions', [projectVersion]);
    cy.task('seedTraces', collections);
    cy.visit(`/projects/${project.projectId}/versions/${projectVersion.versionId}/overview`);
  });

  const openEditModal = (collectionName: string) => {
    cy.contains('.collection-list-item', collectionName)
      .should('be.visible')
      .within(() => {
        cy.get('[aria-label="Edit trace collection"]').click();
      });

    cy.contains('Edit trace collection').should('be.visible');
  };

  // -----------------------------------
  it('opens the edit modal from the collection row and pre-fills the current name', () => {
    const collectionName = collections[0].name;

    openEditModal(collectionName);

    cy.get('#trace-collection-name').should('have.value', collectionName);
    cy.contains('button', 'Save').should('be.disabled');
    cy.contains('button', 'Cancel').should('be.visible');
  });

  // ------------------------------------
  it('renames a collection and updates the overview list', () => {
    const originalName = collections[0].name;
    const renamedCollection = 'Renamed second test';

    cy.intercept(
      'PATCH',
      `/v1/projects/${project.projectId}/versions/${projectVersion.versionId}/traces/collections/${collections[0].traceCollectionId}`
    ).as('editCollection');

    openEditModal(originalName);

    cy.get('#trace-collection-name').clear().type(renamedCollection);
    cy.contains('button', 'Save').should('be.enabled').click();

    cy.wait('@editCollection').its('request.body.name').should('eq', renamedCollection);

    cy.contains('Edit trace collection').should('not.exist');
    cy.contains('.collection-list-item', renamedCollection).should('be.visible');
    cy.contains('.collection-list-item', originalName).should('not.exist');
  });

  // ------------------------------------------------
  it('closes without saving when Cancel is clicked', () => {
    const originalName = collections[0].name;

    openEditModal(originalName);

    cy.get('#trace-collection-name').clear().type('Temporary name');
    cy.contains('button', 'Cancel').click();

    cy.contains('Edit trace collection').should('not.exist');
    cy.contains('.collection-list-item', originalName).should('be.visible');
    cy.contains('.collection-list-item', 'Temporary name').should('not.exist');
  });
});
