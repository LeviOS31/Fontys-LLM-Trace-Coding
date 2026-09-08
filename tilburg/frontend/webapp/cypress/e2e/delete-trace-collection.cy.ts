describe('delete trace collection', () => {
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

  const collection = [
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

  const openEditModal = (collectionName: string) => {
    cy.contains('.collection-list-item', collectionName)
      .should('be.visible')
      .within(() => {
        cy.get('[aria-label="Edit trace collection"]').click();
      });

    cy.contains('Edit trace collection').should('be.visible');
  };

  const openDeleteDialog = (collectionName: string) => {
    openEditModal(collectionName);

    cy.get('[role="dialog"]')
      .contains('button', /^Delete$/)
      .should('be.visible')
      .click();

    cy.get('[role="alertdialog"]').should('be.visible');
  };

  beforeEach(() => {
    cy.task('seedProjects', [project]);
    cy.task('seedVersions', [projectVersion]);
    cy.task('seedTraces', collection);
    visitOverviewPage();
  });

  it('FON-TC-xx: Confirmation popup appears', () => {
    const collectionName = collection[0].name;

    // Given: The user opens the delete dialog for a collection from the edit modal
    openDeleteDialog(collectionName);

    // Then: A confirmation popup appears asking the user to confirm the deletion
    cy.get('[role="alertdialog"]').within(() => {
      cy.contains('Delete the Trace Collection').should('be.visible');
      cy.contains('This will permanently remove the Trace Collection and all its data.').should(
        'be.visible'
      );
      cy.contains(`Type ${collectionName} to confirm`).should('be.visible');
      cy.contains('button', /^Cancel$/).should('be.visible');
      cy.contains('button', /^Delete Collection$/).should('be.visible');
    });

    // And: Delete only becomes enabled after exact name match
    cy.get('[role="alertdialog"]')
      .find('input[placeholder="Collection name"]')
      .type(collectionName);
    cy.get('[role="alertdialog"]').within(() => {
      cy.contains('button', /^Delete Collection$/).should('be.enabled');
    });
  });

  it('FON-TC-xx: Collection is deleted after confirmation', () => {
    const collectionToDelete = collection[0].name;

    // Given: The delete confirmation dialog is shown via the edit modal
    openDeleteDialog(collectionToDelete);

    // When: The user enters the exact collection name and confirms deletion
    cy.get('[role="alertdialog"]')
      .find('input[placeholder="Collection name"]')
      .type(collectionToDelete);
    cy.get('[role="alertdialog"]').within(() => {
      cy.contains('button', /^Delete Collection$/).click();
    });

    // Then: The dialog is closed
    cy.get('[role="alertdialog"]').should('not.exist');

    // And: The collection no longer appears in the collections list
    cy.contains('.collection-list-item', collectionToDelete).should('not.exist');
  });

  it('FON-TC-xx: Collection is not deleted after cancelling', () => {
    const collectionToKeep = collection[0].name;

    // Given: The delete confirmation dialog is shown via the edit modal
    openDeleteDialog(collectionToKeep);

    // When: The user cancels the deletion
    cy.get('[role="alertdialog"]').within(() => {
      cy.contains('button', /^Cancel$/).click();
    });

    // Then: The dialog is closed and the collection remains
    cy.get('[role="alertdialog"]').should('not.exist');
    cy.contains('Edit trace collection').should('be.visible');
    cy.contains('.collection-list-item', collectionToKeep).should('be.visible');
  });

  it('FON-TC-xx: Delete remains disabled when confirmation name is incorrect', () => {
    const collectionName = collection[0].name;

    // Given: The delete confirmation dialog is shown via the edit modal
    openDeleteDialog(collectionName);

    cy.get('[role="alertdialog"]').should('be.visible');

    // When: The user types an incorrect collection name
    cy.get('[role="alertdialog"]')
      .find('input[placeholder="Collection name"]')
      .type(`${collectionName}x`);

    // Then: Delete stays disabled and mismatch hint is visible
    cy.get('[role="alertdialog"]').within(() => {
      cy.contains('button', /^Delete Collection$/).should('be.disabled');
      cy.contains('Collection name does not match.').should('be.visible');
    });

    // And: It is only enabled after an exact match
    cy.get('[role="alertdialog"]')
      .find('input[placeholder="Collection name"]')
      .clear()
      .type(collectionName);
    cy.get('[role="alertdialog"]').within(() => {
      cy.contains('button', /^Delete Collection$/).should('be.enabled');
    });
  });
});
