//
// Filters needs to be reimplemented
//

/*
describe('filter traces', () => {
  const project = {
    projectId: 'de802ddc-d47a-426b-9ce5-f7b81fec0a49',
    name: 'Test Project',
    userId: 'EC1145A3-869D-4B06-B4AE-7308D85839B7',
    description: 'This is a test project',
  };

  const projectVersion = {
    versionId: 'b36c86c0-8db4-4b77-95d0-3f5d8e6a2d01',
    projectId: project.projectId,
    name: 'v1.0.0',
    description: 'Initial release',
  };

  const collectionAlphaId = '00000000-1111-2222-3333-000000000101';
  const collectionBetaId = '00000000-1111-2222-3333-000000000102';

  const alphaPrompt = 'alpha-filter-token-001';
  const betaPrompt = 'beta-filter-token-002';

  const buildCollections = () => [
    {
      traceCollectionId: collectionAlphaId,
      projectVersionId: projectVersion.versionId,
      name: 'Collection Alpha',
      createdAt: new Date('2025-01-01T10:00:00.000Z').toISOString(),
      traces: [
        {
          traceId: 'b1b2c3d4-0001-0000-0000-000000000101',
          traceCollectionId: collectionAlphaId,
          traceMessages: [{ traceMessageType: 0, index: 0, role: 'user', content: alphaPrompt }],
        },
      ],
    },
    {
      traceCollectionId: collectionBetaId,
      projectVersionId: projectVersion.versionId,
      name: 'Collection Beta',
      createdAt: new Date('2025-01-01T11:00:00.000Z').toISOString(),
      traces: [
        {
          traceId: 'b1b2c3d4-0001-0000-0000-000000000102',
          traceCollectionId: collectionBetaId,
          traceMessages: [{ traceMessageType: 0, index: 0, role: 'user', content: betaPrompt }],
        },
      ],
    },
  ];

  const visitOpenCodePage = () => {
    cy.visit(`/projects/${project.projectId}/versions/${projectVersion.versionId}/open-code`);
  };

  const openCollectionFilter = () => {
    cy.contains('Collection')
      .parent()
      .within(() => {
        cy.get('button').click();
      });
  };

  const selectCollection = (collectionName: 'All' | 'Collection Alpha' | 'Collection Beta') => {
    openCollectionFilter();
    cy.contains('[role="option"]', collectionName).click();
  };

  const openCodeCheckbox = () => cy.get('[role="checkbox"]').first();

  const addOpenCodeToAlphaTrace = () => {
    cy.contains(alphaPrompt).click();
    cy.get('textarea[placeholder="Add open code for this trace…"]')
      .clear()
      .type('open code for alpha');
    cy.contains('Saved', { timeout: 5000 }).should('be.visible');
  };

  beforeEach(() => {
    cy.task('seedProjects', [project]);
    cy.task('seedVersions', [projectVersion]);
    cy.task('seedTraces', buildCollections());
    visitOpenCodePage();
  });

  it('filters traces by selected collection', () => {
    selectCollection('Collection Beta');

    cy.contains(betaPrompt).should('be.visible');
    cy.contains(alphaPrompt).should('not.exist');
    cy.location('search').should('include', `traceCollection=${collectionBetaId}`);
  });

  it('filters traces with the has open code toggle after adding open code in the UI', () => {
    addOpenCodeToAlphaTrace();

    openCodeCheckbox().click();
    // hasNoOpenCode=true => show traces WITHOUT open code (beta) and hide those WITH open code (alpha)
    // expect the trace without open code to be visible
    cy.contains(betaPrompt).should('be.visible');
    cy.location('search').should('include', 'hasNoOpenCode=true');
  });

  it('applies collection and has open code filters together', () => {
    addOpenCodeToAlphaTrace();

    // Select the collection that contains only the trace with open code (alpha)
    selectCollection('Collection Alpha');
    openCodeCheckbox().click();

    // Collection Alpha only contains the alpha trace which now has open code,
    // so hasNoOpenCode=true + collection=Alpha should result in no traces shown.
    cy.contains('No traces found.').should('be.visible');
    cy.location('search').should('include', `traceCollection=${collectionAlphaId}`);
    cy.location('search').should('include', 'hasNoOpenCode=true');
  });

  it('keeps collection and has open code filters after refresh', () => {
    addOpenCodeToAlphaTrace();

    selectCollection('Collection Alpha');
    openCodeCheckbox().click();

    cy.location('search').should('include', `traceCollection=${collectionAlphaId}`);
    cy.location('search').should('include', 'hasNoOpenCode=true');
    // Collection Alpha only contains the alpha trace which now has open code,
    // so hasNoOpenCode=true should result in no traces shown.
    cy.contains('No traces found.').should('be.visible');
    cy.contains(betaPrompt).should('not.exist');

    cy.reload();

    cy.location('search').should('include', `traceCollection=${collectionAlphaId}`);
    cy.location('search').should('include', 'hasNoOpenCode=true');
    cy.contains('No traces found.').should('be.visible');
    cy.contains(betaPrompt).should('not.exist');
  });
});
*/
