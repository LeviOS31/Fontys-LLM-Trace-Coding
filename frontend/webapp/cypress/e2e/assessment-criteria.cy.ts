describe('assessment criteria', () => {
  const projectId = 'de802ddc-d47a-426b-9ce5-f7b81fec0a49';
  const versionId = 'de802ddc-d47a-426b-9ce5-f7b81fec0a50';
  const traceId = 'b1b2c3d4-0001-0000-0000-000000000001';

  const project = {
    projectId,
    name: 'Test Project',
    description: 'This is a test project',
    userId: 'EC1145A3-869D-4B06-B4AE-7308D85839B7',
  };

  const version = {
    versionId,
    projectId,
    name: 'Test Version',
    description: 'This is a test version',
  };

  const buildCollection = () => ({
    traceCollectionId: '00000000-1111-2222-3333-000000000010',
    projectVersionId: versionId,
    name: 'Collection 1',
    createdAt: new Date().toISOString(),
    traces: [
      {
        traceGroupId: '00000000-1111-2222-3333-000000000011',

        traceId,
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
  });

  const visitOpenCodePage = () => {
    cy.visit(`/projects/${projectId}/versions/${versionId}/open-code`);
    cy.contains('Collection 1', { timeout: 10000 }).click();
    cy.contains('Test Scope (1.0.0)', { timeout: 10000 });
    cy.contains('Project assessment criteria', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="assessment-criterion-create-input"]', { timeout: 10000 }).should(
      'be.visible'
    );
  };

  const createCriterion = (criterion: string) => {
    cy.get('[data-testid="assessment-criterion-create-input"]').type(criterion);
    cy.get('[data-testid="assessment-criterion-create-input"]').type('{enter}');
  };

  const getCriterionRow = () => {
    return cy.get('[data-testid="assessment-criterion-row"]').first();
  };

  context('displaying and creating criteria', () => {
    beforeEach(() => {
      cy.task('seedProjects', [project]);
      cy.task('seedVersions', [version]);
      cy.task('seedTraces', [buildCollection()]);
      visitOpenCodePage();
    });

    // FON-TC-1: Display assessment criterion
    it('displays assessment criterion', () => {
      const criterion = 'Password must be at least 8 characters';

      createCriterion(criterion);

      cy.contains(criterion).should('be.visible');
    });

    // FON-TC-2: Create assessment criterion
    it('creates assessment criterion', () => {
      const criterion = 'User can create an account';

      cy.get('[data-testid="assessment-criterion-create-input"]').type(criterion);
      cy.get('[data-testid="assessment-criterion-create-input"]').type('{enter}');

      cy.contains(criterion).should('be.visible');
      cy.get('[data-testid="assessment-criterion-create-input"]').should('have.value', '');
    });
  });

  context('editing and deleting criteria', () => {
    const initialCriterion = 'Initial assessment criterion';

    beforeEach(() => {
      cy.task('seedProjects', [project]);
      cy.task('seedVersions', [version]);
      cy.task('seedTraces', [buildCollection()]);
      visitOpenCodePage();
      createCriterion(initialCriterion);
      cy.contains(initialCriterion).should('be.visible');
    });

    // FON-TC-3: Edit assessment criterion: Other value
    it('edits assessment criterion to other value', () => {
      const updatedCriterion = 'Other value';

      getCriterionRow()
        .should('contain', initialCriterion)
        .find('[data-testid="assessment-criterion-text"]')
        .click();
      getCriterionRow()
        .find('input')
        .should('have.value', initialCriterion)
        .clear()
        .type(updatedCriterion)
        .blur();

      cy.contains(updatedCriterion).should('be.visible');
      cy.contains(initialCriterion).should('not.exist');
    });

    // FON-TC-4: Edit assessment criterion: escape to cancel, no changes
    it('cancels edit with escape and keeps the original value', () => {
      getCriterionRow()
        .should('contain', initialCriterion)
        .find('[data-testid="assessment-criterion-text"]')
        .click();
      getCriterionRow()
        .find('input')
        .should('have.value', initialCriterion)
        .type(' changed')
        .type('{esc}');

      cy.contains(initialCriterion).should('be.visible');
      cy.contains('changed').should('not.exist');
    });

    // FON-TC-5: Delete (with confirm) on the button
    it('deletes assessment criterion after confirming the button', () => {
      getCriterionRow()
        .should('contain', initialCriterion)
        .find('[data-testid="assessment-criterion-delete"]')
        .click();
      getCriterionRow().find('[data-testid="assessment-criterion-delete-confirm"]').click();

      cy.contains(initialCriterion).should('not.exist');
    });

    // FON-TC-6: Delete by editing and keeping the input empty
    it('deletes assessment criterion when editing and leaving the input empty', () => {
      getCriterionRow()
        .should('contain', initialCriterion)
        .find('[data-testid="assessment-criterion-text"]')
        .click();
      getCriterionRow().find('input').should('have.value', initialCriterion).clear().blur();

      cy.contains(initialCriterion).should('not.exist');
    });
  });
});
