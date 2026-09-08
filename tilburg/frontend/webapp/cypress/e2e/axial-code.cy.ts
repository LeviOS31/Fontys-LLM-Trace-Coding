describe('axial code', () => {
  const buildTrace = (traceId: string, index: number) => ({
    traceId,
    traceCollectionId: '00000000-1111-2222-3333-000000000020',

    traceGroupId: '00000000-1111-2222-3333-000000000020',

    traceResources: [
      {
        key: 'service.name',
        value: 'Axial Code Test Service',
        attributeType: 0,
      },
    ],

    traceScopes: [
      {
        scopeId: `00000000-1111-2222-3333-00000000010${index}`,
        name: 'AxialCodeTestScope',
        version: '1.0.0',

        spans: [
          {
            spanId: `00000000-1111-2222-3333-00000000020${index}`,
            parentSpanId: null,
            name: `Axial Code Test Span ${index}`,
            startTimeUnixNano: Date.now() * 1_000_000,
            endTimeUnixNano: (Date.now() + 1000) * 1_000_000,
            spanKind: 1,

            attributes: [],
            events: [],
          },
        ],
      },
    ],
  });

  const projectId = 'de802ddc-d47a-426b-9ce5-f7b81fec0a49';
  const versionId = 'de802ddc-d47a-426b-9ce5-f7b81fec0a49';

  // Trace IDs — seeded as traces AND used as traceIds in axial codes
  const traceId1 = 'b1b2c3d4-0001-0000-0000-000000000001';
  const traceId2 = 'b1b2c3d4-0002-0000-0000-000000000001';
  const traceId3 = 'b1b2c3d4-0003-0000-0000-000000000001';
  const traceId4 = 'b1b2c3d4-0004-0000-0000-000000000001';
  const traceId5 = 'b1b2c3d4-0005-0000-0000-000000000001';
  const traceId6 = 'b1b2c3d4-0006-0000-0000-000000000001';
  const traceId7 = 'b1b2c3d4-0007-0000-0000-000000000001';

  const resultIdA = 'aaaaaaaa-0001-0000-0000-000000000001';
  const resultIdB = 'bbbbbbbb-0001-0000-0000-000000000001';

  const project = {
    projectId,
    name: 'Axial Code Test Project',
    description: 'Project for axial code e2e tests',
    userId: 'EC1145A3-869D-4B06-B4AE-7308D85839B7',
  };

  const version = {
    versionId,
    projectId,
    name: 'Test Version',
    description: 'Version for axial code e2e tests',
  };

  const traceCollection = {
    traceCollectionId: '00000000-1111-2222-3333-000000000020',
    projectVersionId: versionId,
    name: 'Test Collection',
    createdAt: new Date().toISOString(),
    traces: [
      buildTrace(traceId1, 1),
      buildTrace(traceId2, 2),
      buildTrace(traceId3, 3),
      buildTrace(traceId4, 4),
      buildTrace(traceId5, 5),
      buildTrace(traceId6, 6),
      buildTrace(traceId7, 7),
    ],
  };

  const openCodes = [
    {
      openCodeId: 'ec000001-0000-0000-0000-000000000001',
      traceId: traceId1,
      openCodeValue: 'User struggled to find the settings menu',
    },
    {
      openCodeId: 'ec000002-0000-0000-0000-000000000001',
      traceId: traceId2,
      openCodeValue: 'Confusing error message on login',
    },
    {
      openCodeId: 'ec000003-0000-0000-0000-000000000001',
      traceId: traceId3,
      openCodeValue: 'Page took 8 seconds to load',
    },
    {
      openCodeId: 'ec000004-0000-0000-0000-000000000001',
      traceId: traceId4,
      openCodeValue: 'Search results were very slow',
    },
    {
      openCodeId: 'ec000005-0000-0000-0000-000000000001',
      traceId: traceId5,
      openCodeValue: 'App crashed during checkout',
    },
    {
      openCodeId: 'ec000006-0000-0000-0000-000000000001',
      traceId: traceId6,
      openCodeValue: 'Back button did not work as expected',
    },
    {
      openCodeId: 'ec000007-0000-0000-0000-000000000001',
      traceId: traceId7,
      openCodeValue: 'User asked if the site is secure',
    },
  ];

  // Snapshot A axial codes — aligned with seeded data and used as the mock generate response in scenario 1
  const mockAxialCodesA = [
    {
      label: 'Usability Issues',
      description: 'Problems related to navigation and UX',
      traceIds: [openCodes[0].traceId, openCodes[1].traceId, openCodes[2].traceId],
    },
    {
      label: 'Performance Concerns',
      description: 'Slow response times and crashes',
      traceIds: [openCodes[3].traceId, openCodes[4].traceId],
    },
  ];

  // Snapshot B axial codes — different labels with no overlap, used as mock regen response
  const mockAxialCodesB = [
    {
      label: 'Navigation Friction',
      description: 'Users struggle to find features',
      traceIds: [openCodes[0].traceId, openCodes[5].traceId],
    },
    {
      label: 'Error Recovery',
      description: 'System fails to handle failure gracefully',
      traceIds: [openCodes[1].traceId, openCodes[2].traceId],
    },
    {
      label: 'Trust Signals',
      description: 'User concerns about security and reliability',
      traceIds: [openCodes[3].traceId, openCodes[4].traceId, openCodes[6].traceId],
    },
  ];

  // Seeded snapshot A for scenario 2 (existing approved result in DB)
  const seededAxialResultA = {
    axialCodingResultId: resultIdA,
    projectVersionId: versionId,
    isActive: true,
    createdAt: '2026-05-20T10:00:00.000Z',
    axialCodes: [
      {
        axialCodeId: 'ac000001-0000-0000-0000-000000000001',
        label: 'Usability Issues',
        description: 'Problems related to navigation and UX',
        traceIds: [openCodes[0].traceId, openCodes[1].traceId, openCodes[2].traceId],
      },
      {
        axialCodeId: 'ac000002-0000-0000-0000-000000000001',
        label: 'Performance Concerns',
        description: 'Slow response times and crashes',
        traceIds: [openCodes[3].traceId, openCodes[4].traceId],
      },
    ],
  };

  const visitAxialCodePage = () => {
    cy.visit(`/projects/${projectId}/versions/${versionId}/axial-code`);
  };

  const getAxialCodeCard = (title: string) => cy.contains('[data-testid="axial-code-card"]', title);

  const generateFirstSnapshot = () => {
    cy.contains('button', 'Generate Axial Codes').click();
    cy.wait('@generate');
    cy.wait('@save');
  };

  const regenerateWithFeedback = (feedback: string) => {
    cy.contains('button', /^Regenerate/).click();
    cy.get('[role="dialog"]')
      .should('be.visible')
      .within(() => {
        cy.contains('Regenerate axial codes').should('be.visible');
        cy.get('textarea').type(feedback);
        cy.contains('button', /^Regenerate$/).click();
      });
    cy.wait('@generate');
  };

  // Intercepts only the LLM-backed endpoints — GET /current and GET /opencodes hit the real backend
  const interceptGenerate = (codes: typeof mockAxialCodesA, resultId: string) => {
    cy.intercept('POST', /\/axial-coding-results\/generate$/, {
      body: { axialCodingResultId: resultId, axialCodes: codes },
    }).as('generate');
  };

  const interceptSave = () => {
    // The fake result ID from the intercepted generate won't exist in the DB,
    // so we mock save to avoid a 404.
    cy.intercept('POST', /\/axial-coding-results\/[^/]+\/save$/, { statusCode: 200, body: {} }).as(
      'save'
    );
  };

  // Scenario 1: First generation — no existing axial codes in DB
  context('given no existing axial codes', () => {
    beforeEach(() => {
      cy.task('seedProjects', [project]);
      cy.task('seedVersions', [version]);
      cy.task('seedTraces', [traceCollection]);
      cy.task('seedOpenCodes', openCodes);

      interceptGenerate(mockAxialCodesA, resultIdA);
      interceptSave();

      visitAxialCodePage();
    });

    it('shows the Generate Axial Codes button with the open code count', () => {
      cy.contains('button', 'Generate Axial Codes').should('be.visible');
      cy.contains(`${openCodes.length} open codes`).should('be.visible');
    });

    it('does not show the summary section or axial code cards before generation', () => {
      cy.contains('Summary').should('not.exist');
      cy.contains('Usability Issues').should('not.exist');
    });

    it('auto-approves the first generation and shows the summary + code list', () => {
      generateFirstSnapshot();

      // Panel title switches to Regenerate (first-gen button is gone)
      cy.contains('Regenerate Axial Codes').should('be.visible');
      cy.contains('button', 'Generate Axial Codes').should('not.exist');

      // Summary section appears
      cy.contains('Summary').should('be.visible');
      cy.contains('Version Date:').should('be.visible');

      // Both axial code cards from the mocked response are visible
      cy.contains('Usability Issues').should('be.visible');
      cy.contains('Performance Concerns').should('be.visible');
    });

    it('shows prevalence and open code count on each card after generation', () => {
      generateFirstSnapshot();

      getAxialCodeCard('Usability Issues').within(() => {
        cy.contains('prevalence').should('be.visible');
        cy.contains('open codes').should('be.visible');
      });
    });

    it('expands a card to reveal open codes section with seeded open code text', () => {
      generateFirstSnapshot();

      getAxialCodeCard('Usability Issues').within(() => {
        cy.contains('button', 'Expand details ↓').click();
        cy.contains('Open codes').should('be.visible');
        // Open code text from the seeded data appears in the expanded card
        cy.contains('User struggled to find the settings menu').should('be.visible');
      });
    });
  });

  // Scenarios 2 & 3: Regeneration with feedback, comparison view, approve B
  context('given an approved snapshot A in DB', () => {
    beforeEach(() => {
      cy.task('seedProjects', [project]);
      cy.task('seedVersions', [version]);
      cy.task('seedTraces', [traceCollection]);
      cy.task('seedOpenCodes', openCodes);
      cy.task('seedAxialCodingResults', [seededAxialResultA]);

      visitAxialCodePage();

      // Wait for the real GET /current to return seeded data before each test
      cy.contains('Usability Issues', { timeout: 8000 }).should('be.visible');
    });

    it('shows the Regenerate Axial Codes panel (not first-generate)', () => {
      cy.contains('Regenerate Axial Codes').should('be.visible');
      cy.contains('button', 'Generate Axial Codes').should('not.exist');
    });

    it('shows the approved snapshot summary and axial code cards', () => {
      cy.contains('Summary').should('be.visible');
      cy.contains('Usability Issues').should('be.visible');
      cy.contains('Performance Concerns').should('be.visible');
    });

    it('shows the open code count from seeded data in the regenerate panel', () => {
      cy.contains(`${openCodes.length} open codes`).should('be.visible');
    });

    context('when the user regenerates with feedback', () => {
      const feedback = 'Split usability into navigation and error recovery, add trust signals';

      beforeEach(() => {
        interceptGenerate(mockAxialCodesB, resultIdB);
        interceptSave();

        regenerateWithFeedback(feedback);
      });

      // Interpretation panel
      it('hides the regenerate panel in comparison mode', () => {
        cy.contains('Regenerate Axial Codes').should('not.exist');
      });

      it('shows the interpretation panel', () => {
        cy.contains('Interpretation of changes').should('be.visible');
      });

      it('shows the correct headline in the interpretation panel', () => {
        cy.contains('Regenerated based on your feedback').should('be.visible');
      });

      it('displays the user feedback text in the interpretation panel', () => {
        cy.contains(feedback).should('be.visible');
      });

      it('shows the axial code count delta (A had 2, B has 3 → +1)', () => {
        cy.contains('+1').should('be.visible');
      });

      // Comparison snapshot summaries
      it('shows summary cards for both Version A and Version B', () => {
        cy.contains('Version A ·').should('be.visible');
        cy.contains('Version B ·').should('be.visible');
      });

      // Axial code lists
      it('shows snapshot A axial code cards in the comparison list', () => {
        cy.contains('Usability Issues').should('be.visible');
        cy.contains('Performance Concerns').should('be.visible');
      });

      it('shows snapshot B axial code cards in the comparison list', () => {
        cy.contains('Navigation Friction').should('be.visible');
        cy.contains('Error Recovery').should('be.visible');
        cy.contains('Trust Signals').should('be.visible');
      });

      it('shows Version B decision panel with all three action buttons', () => {
        cy.contains('Version B decision').should('be.visible');
        cy.contains('button', 'Approve Version B').should('be.visible');
        cy.contains('button', 'Regenerate').should('be.visible');
        cy.contains('button', 'Discard · Not approved').should('be.visible');
      });

      // Scenario 3: Approve snapshot B
      context('when the user approves Version B', () => {
        beforeEach(() => {
          cy.contains('button', 'Approve Version B').click();
          cy.wait('@save');
        });

        it('exits comparison mode and shows the regenerate panel', () => {
          cy.contains('Regenerate Axial Codes').should('be.visible');
        });

        it('removes the interpretation panel', () => {
          cy.contains('Interpretation of changes').should('not.exist');
          cy.contains('Version B decision').should('not.exist');
        });

        it('shows the approved B codes in the single-view code list', () => {
          cy.contains('Navigation Friction').should('be.visible');
          cy.contains('Error Recovery').should('be.visible');
          cy.contains('Trust Signals').should('be.visible');
        });

        it('no longer shows the original snapshot A codes', () => {
          cy.contains('Usability Issues').should('not.exist');
          cy.contains('Performance Concerns').should('not.exist');
        });

        it('shows the summary section for the approved snapshot', () => {
          cy.contains('Summary').should('be.visible');
          cy.contains('Version Date:').should('be.visible');
        });
      });

      // Discard flow
      context('when the user discards Version B', () => {
        it('exits comparison mode and restores the snapshot A single view', () => {
          cy.contains('button', 'Discard · Not approved').click();

          cy.contains('Interpretation of changes').should('not.exist');
          cy.contains('Regenerate Axial Codes').should('be.visible');
          cy.contains('Usability Issues').should('be.visible');
          cy.contains('Performance Concerns').should('be.visible');
          cy.contains('Navigation Friction').should('not.exist');
        });
      });
    });
  });
});
