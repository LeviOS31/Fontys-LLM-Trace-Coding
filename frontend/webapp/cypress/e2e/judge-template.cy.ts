describe('judge template', () => {
  const projectId = 'de802ddc-d47a-426b-9ce5-f7b81fec0a49';
  const versionId = 'de802ddc-d47a-426b-9ce5-f7b81fec0a51';

  const traceId1 = 'b1b2c3d4-0011-0000-0000-000000000001';
  const traceId2 = 'b1b2c3d4-0012-0000-0000-000000000001';

  const axialCodeId1 = 'ac110001-0000-0000-0000-000000000001';
  const axialCodeId2 = 'ac110002-0000-0000-0000-000000000001';
  const axialResultId = 'ab110001-0000-0000-0000-000000000001';

  const templateId1 = 'ee110001-0000-0000-0000-000000000001';
  const templateId2 = 'ee110002-0000-0000-0000-000000000001';

  const project = {
    projectId,
    name: 'Judge Template Test Project',
    description: 'Project for judge template e2e tests',
    userId: 'EC1145A3-869D-4B06-B4AE-7308D85839B7',
  };

  const version = {
    versionId,
    projectId,
    name: 'Test Version',
    description: 'Version for judge template e2e tests',
  };

  const traceCollection = {
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
  };
  const seededAxialResult = {
    axialCodingResultId: axialResultId,
    projectVersionId: versionId,
    isActive: true,
    createdAt: '2026-06-01T10:00:00.000Z',
    axialCodes: [
      {
        axialCodeId: axialCodeId1,
        label: 'Usability Issues',
        description: 'Problems related to navigation and UX',
        traceIds: [traceId1],
      },
      {
        axialCodeId: axialCodeId2,
        label: 'Performance Concerns',
        description: 'Slow response times and crashes',
        traceIds: [traceId2],
      },
    ],
  };

  const buildTemplate = (overrides = {}) => ({
    judgeTemplateId: templateId1,
    judgeTemplateName: 'Judge template - Usability Issues',
    judgeTemplateDescription: 'Problems related to navigation and UX',
    axialCodeId: axialCodeId1,
    projectId,
    projectVersionId: versionId,
    isDeprecated: false,
    ...overrides,
  });

  const visitPage = () => {
    cy.visit(`/projects/${projectId}/versions/${versionId}/judge-template`);
  };

  const getTemplateRow = (name: string) => cy.contains('.judge-template-row', name);

  const seedPrerequisites = () => {
    cy.task('seedProjects', [project]);
    cy.task('seedVersions', [version]);
    cy.task('seedTraces', [traceCollection]);
    cy.task('seedAxialCodingResults', [seededAxialResult]);
  };

  context('given no templates', () => {
    beforeEach(() => {
      seedPrerequisites();
      visitPage();
      cy.contains('Judge Template', { timeout: 10000 }).should('be.visible');
    });

    it('shows the empty state message', () => {
      cy.contains('No templates match your filters.').should('be.visible');
    });

    it('shows 0 templates in the list header', () => {
      cy.contains('0 templates').should('be.visible');
    });

    it('shows the Create Template panel', () => {
      cy.contains('Create Judge Template').should('be.visible');
    });

    it('disables Create Template button when no axial code is selected', () => {
      cy.contains('button', 'Create Template').should('be.disabled');
    });

    it('enables Create Template button after selecting an axial code', () => {
      cy.get('select').select('Usability Issues');
      cy.contains('button', 'Create Template').should('not.be.disabled');
    });
  });

  context('given existing templates', () => {
    beforeEach(() => {
      seedPrerequisites();
      cy.task('seedJudgeTemplates', [
        buildTemplate(),
        buildTemplate({
          judgeTemplateId: templateId2,
          judgeTemplateName: 'Judge template - Performance Concerns',
          judgeTemplateDescription: 'Slow response times and crashes',
          axialCodeId: axialCodeId2,
        }),
      ]);
      visitPage();
      cy.contains('Judge template - Usability Issues', { timeout: 10000 }).should('be.visible');
    });

    it('shows all templates in the list', () => {
      cy.contains('Judge template - Usability Issues').should('be.visible');
      cy.contains('Judge template - Performance Concerns').should('be.visible');
    });

    it('shows the correct template count', () => {
      cy.contains('2 templates').should('be.visible');
    });

    it('shows the template description in the row', () => {
      cy.contains('Problems related to navigation and UX').should('be.visible');
    });

    context('search', () => {
      it('filters templates by name', () => {
        cy.get('input[placeholder="Search judge templates…"]').type('Usability');

        cy.contains('Judge template - Usability Issues').should('be.visible');
        cy.contains('Judge template - Performance Concerns').should('not.exist');
      });

      it('filters templates by description', () => {
        cy.get('input[placeholder="Search judge templates…"]').type('Slow response');

        cy.contains('Judge template - Performance Concerns').should('be.visible');
        cy.contains('Judge template - Usability Issues').should('not.exist');
      });

      it('shows empty state when no templates match the search', () => {
        cy.get('input[placeholder="Search judge templates…"]').type('nonexistent query xyz');

        cy.contains('No templates match your filters.').should('be.visible');
      });

      it('restores all templates when search is cleared', () => {
        cy.get('input[placeholder="Search judge templates…"]').type('Usability').clear();

        cy.contains('Judge template - Usability Issues').should('be.visible');
        cy.contains('Judge template - Performance Concerns').should('be.visible');
      });
    });

    context('opening a template', () => {
      it('opens the modal when clicking a row', () => {
        getTemplateRow('Judge template - Usability Issues').click();

        cy.get('[role="dialog"]').should('be.visible');
        cy.get('[role="dialog"]').contains('Judge Template').should('be.visible');
      });

      it('shows the name, description, and judge instructions in the modal', () => {
        getTemplateRow('Judge template - Usability Issues').click();

        cy.get('[role="dialog"]').within(() => {
          cy.get('input[readonly]').should('have.value', 'Judge template - Usability Issues');
          cy.get('textarea[readonly]')
            .first()
            .should('have.value', 'Problems related to navigation and UX');
          cy.contains('Judge instructions').should('be.visible');
        });
      });

      it('closes the modal with the close button', () => {
        getTemplateRow('Judge template - Usability Issues').click();
        cy.get('[role="dialog"]').should('be.visible');

        cy.get('[role="dialog"]').find('[aria-label="Close"]').click();
        cy.get('[role="dialog"]').should('not.exist');
      });

      it('closes the modal with the Close button in the footer', () => {
        getTemplateRow('Judge template - Usability Issues').click();

        cy.get('[role="dialog"]').find('button').contains('Close').click();
        cy.get('[role="dialog"]').should('not.exist');
      });
    });

    context('deleting a template from the row', () => {
      it('shows the confirm dialog when clicking the delete icon', () => {
        getTemplateRow('Judge template - Usability Issues')
          .find('[aria-label="Delete template"]')
          .click();

        cy.contains('Delete judge template').should('be.visible');
        cy.contains('Judge template - Usability Issues').should('be.visible');
      });

      it('removes the template after confirming delete', () => {
        getTemplateRow('Judge template - Usability Issues')
          .find('[aria-label="Delete template"]')
          .click();
        cy.contains('button', 'Delete').click();

        cy.contains('Judge template - Usability Issues').should('not.exist');
        cy.contains('Judge template - Performance Concerns').should('be.visible');
      });

      it('keeps the template when cancelling the delete dialog', () => {
        getTemplateRow('Judge template - Usability Issues')
          .find('[aria-label="Delete template"]')
          .click();
        cy.contains('button', 'Cancel').click();

        cy.contains('Judge template - Usability Issues').should('be.visible');
      });
    });

    context('deleting a template from the modal', () => {
      beforeEach(() => {
        getTemplateRow('Judge template - Usability Issues').click();
        cy.get('[role="dialog"]').should('be.visible');
      });

      it('removes the template and closes the modal after confirming delete', () => {
        cy.get('[role="dialog"]').find('button').contains('Delete Template').click();
        cy.get('[role="alertdialog"]').find('button').contains('Delete').click();

        cy.get('[role="dialog"]').should('not.exist');
        cy.contains('Judge template - Usability Issues').should('not.exist');
      });

      it('keeps the modal open when cancelling delete from the modal', () => {
        cy.get('[role="dialog"]').find('button').contains('Delete Template').click();
        cy.get('[role="alertdialog"]').find('button').contains('Cancel').click();

        cy.get('[role="dialog"]').should('be.visible');
        cy.contains('Judge template - Usability Issues').should('be.visible');
      });
    });
  });

  context('given a deprecated template', () => {
    beforeEach(() => {
      seedPrerequisites();
      cy.task('seedJudgeTemplates', [buildTemplate({ isDeprecated: true })]);
      visitPage();
      cy.contains('Judge template - Usability Issues', { timeout: 10000 }).should('be.visible');
    });

    it('shows the Not synced badge on a deprecated template', () => {
      cy.contains('Not synced').should('be.visible');
    });

    it('shows the deprecation warning inside the modal', () => {
      getTemplateRow('Judge template - Usability Issues').click();

      cy.get('[role="dialog"]').contains('Heads up').should('be.visible');
      cy.get('[role="dialog"]').contains('not synced').should('be.visible');
    });
  });

  context('creating a template', () => {
    const newTemplateId = 'ee110099-0000-0000-0000-000000000001';

    beforeEach(() => {
      seedPrerequisites();

      cy.intercept('POST', /axial-codes\/[^/]+\/judge-template$/, {
        body: { judgeTemplateId: newTemplateId },
      }).as('createTemplate');

      cy.intercept('GET', /judge-templates$/, {
        body: {
          judgeTemplates: [
            {
              id: newTemplateId,
              name: 'Judge template - Usability Issues',
              description: 'Problems related to navigation and UX',
              template: 'You are a judge. Evaluate: {{axial_code_name}}.',
              isDeprecated: false,
            },
          ],
        },
      }).as('getTemplates');

      visitPage();
      cy.wait('@getTemplates');
    });

    it('shows the created template in the list after creation', () => {
      cy.get('select').select('Usability Issues');
      cy.contains('button', 'Create Template').click();

      cy.wait('@createTemplate');
      cy.wait('@getTemplates');

      cy.contains('Judge template - Usability Issues').should('be.visible');
    });

    it('shows the creating state while the request is in flight', () => {
      cy.intercept('POST', /axial-codes\/[^/]+\/judge-template$/, (req) => {
        req.reply({ delay: 500, body: { judgeTemplateId: newTemplateId } });
      }).as('createTemplateSlow');

      cy.get('select').select('Usability Issues');
      cy.contains('button', 'Create Template').click();

      cy.contains('Creating…').should('be.visible');
      cy.wait('@createTemplateSlow');
    });
  });
});
