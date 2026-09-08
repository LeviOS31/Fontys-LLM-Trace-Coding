describe('version statistics', () => {
  const project = {
    projectId: 'bc01ddc0-d47a-426b-9ce5-f7b81fec0a02',
    userId: 'EC1145A3-869D-4B06-B4AE-7308D85839B7',
    name: 'Version Statistics Test Project',
    description: 'Project for version-statistics e2e assertions',
  };

  const version = {
    versionId: 'bc010001-0000-0000-0000-000000000001',
    projectId: project.projectId,
    name: 'v2.0.0',
    description: 'Version for statistics assertions',
  };

  const collection = {
    traceCollectionId: 'bc010002-0000-0000-0000-000000000001',
    projectVersionId: version.versionId,
    name: 'Stats Collection',
    createdAt: new Date().toISOString(),
    traces: [
      {
        traceGroupId: 'bc010100-0000-0000-0000-000000000001',
        traceId: 'bc010003-0000-0000-0000-000000000001',
        traceCollectionId: 'bc010002-0000-0000-0000-000000000001',
        traceResources: [],
        traceScopes: [],
      },
      {
        traceGroupId: 'bc010100-0000-0000-0000-000000000002',
        traceId: 'bc010003-0000-0000-0000-000000000002',
        traceCollectionId: 'bc010002-0000-0000-0000-000000000001',
        traceResources: [],
        traceScopes: [],
      },
      {
        traceGroupId: 'bc010100-0000-0000-0000-000000000003',
        traceId: 'bc010003-0000-0000-0000-000000000003',
        traceCollectionId: 'bc010002-0000-0000-0000-000000000001',
        traceResources: [],
        traceScopes: [],
      },
      {
        traceGroupId: 'bc010100-0000-0000-0000-000000000004',
        traceId: 'bc010003-0000-0000-0000-000000000004',
        traceCollectionId: 'bc010002-0000-0000-0000-000000000001',
        traceResources: [],
        traceScopes: [],
      },
      {
        traceGroupId: 'bc010100-0000-0000-0000-000000000005',
        traceId: 'bc010003-0000-0000-0000-000000000005',
        traceCollectionId: 'bc010002-0000-0000-0000-000000000001',
        traceResources: [],
        traceScopes: [],
      },
    ],
  };

  // One open code per trace (set on the trace row itself)
  const openCodes = [
    {
      openCodeId: 'bc010004-0000-0000-0000-000000000001',
      traceId: collection.traces[0].traceId,
      openCodeValue: 'User confused by onboarding flow',
    },
    {
      openCodeId: 'bc010004-0000-0000-0000-000000000002',
      traceId: collection.traces[1].traceId,
      openCodeValue: 'Settings page hard to find',
    },
    {
      openCodeId: 'bc010004-0000-0000-0000-000000000003',
      traceId: collection.traces[2].traceId,
      openCodeValue: 'Modal closed unexpectedly',
    },
    {
      openCodeId: 'bc010004-0000-0000-0000-000000000004',
      traceId: collection.traces[3].traceId,
      openCodeValue: 'API call took over 5 seconds',
    },
    {
      openCodeId: 'bc010004-0000-0000-0000-000000000005',
      traceId: collection.traces[4].traceId,
      openCodeValue: 'Database query timeout',
    },
  ];

  // 2 axial codes, each grouping the traces it covers:
  //   "UX Friction"     — 3 traces (the largest)
  //   "Backend Latency" — 2 traces
  const axialResult = {
    axialCodingResultId: 'bc010005-0000-0000-0000-000000000001',
    projectVersionId: version.versionId,
    isActive: true,
    createdAt: '2026-02-01T10:00:00.000Z',
    axialCodes: [
      {
        axialCodeId: 'bc010006-0000-0000-0000-000000000001',
        label: 'UX Friction',
        description: 'User experience pain points',
        traceIds: [
          collection.traces[0].traceId,
          collection.traces[1].traceId,
          collection.traces[2].traceId,
        ],
      },
      {
        axialCodeId: 'bc010006-0000-0000-0000-000000000002',
        label: 'Backend Latency',
        description: 'Server-side performance issues',
        traceIds: [collection.traces[3].traceId, collection.traces[4].traceId],
      },
    ],
  };

  const visitOverviewPage = () => {
    cy.visit(`/projects/${project.projectId}/versions/${version.versionId}/overview`);
  };

  const interceptVersionStats = () => {
    cy.intercept(
      'GET',
      `**/v1/projects/${project.projectId}/versions/${version.versionId}/statistics`
    ).as('getVersionStats');
  };

  // ---------------------------------------------------------------------------
  // Scenario: version with traces, open codes, and axial codes
  // ---------------------------------------------------------------------------
  context('with traces, open codes, and axial codes', () => {
    beforeEach(() => {
      cy.task('seedProjects', [project]);
      cy.task('seedVersions', [version]);
      cy.task('seedTraces', [collection]);
      cy.task('seedOpenCodes', openCodes);
      cy.task('seedAxialCodingResults', [axialResult]);
    });

    it('shows the Statistics heading', () => {
      interceptVersionStats();
      visitOverviewPage();
      cy.wait('@getVersionStats');

      cy.contains('Statistics').should('be.visible');
    });

    it('validates total traces, open codes, and axial codes counters against the statistics API', () => {
      interceptVersionStats();
      visitOverviewPage();

      cy.wait('@getVersionStats').then((interception) => {
        const stats = interception.response?.body;

        cy.contains('Total Traces').next().should('contain.text', String(stats.versionTraceCount));

        cy.contains('Total Open codes')
          .next()
          .should('contain.text', String(stats.versionOpenCodeCount));

        cy.contains('Total Axial codes')
          .next()
          .should('contain.text', String(stats.versionAxialCodeCount));
      });
    });

    it('shows the correct largest axial code label derived from API data', () => {
      interceptVersionStats();
      visitOverviewPage();

      cy.wait('@getVersionStats').then((interception) => {
        const stats = interception.response?.body;
        const axialCodes: { label: string; openCodeCount: number }[] =
          stats.versionAxialCodes ?? [];
        const largest = axialCodes.reduce(
          (max, code) => (code.openCodeCount > (max?.openCodeCount ?? 0) ? code : max),
          axialCodes[0]
        );

        cy.contains('Largest Axial Code').next().should('contain.text', largest.label);
      });
    });

    it('shows the correct average open codes per axial code derived from API data', () => {
      interceptVersionStats();
      visitOverviewPage();

      cy.wait('@getVersionStats').then((interception) => {
        const stats = interception.response?.body;
        const axialCodes: { openCodeCount: number }[] = stats.versionAxialCodes ?? [];
        const avg = (
          axialCodes.reduce((sum, c) => sum + c.openCodeCount, 0) / axialCodes.length
        ).toFixed(1);

        cy.contains('Avg open codes per axial code').next().should('contain.text', avg);
      });
    });

    it('shows a treemap containing the axial code labels', () => {
      interceptVersionStats();
      visitOverviewPage();
      cy.wait('@getVersionStats');

      cy.contains('UX Friction').should('be.visible');
      cy.contains('Backend Latency').should('be.visible');
    });
  });

  // ---------------------------------------------------------------------------
  // Scenario: version with traces but no open codes or axial codes
  // ---------------------------------------------------------------------------
  context('with traces but no open codes or axial codes', () => {
    beforeEach(() => {
      cy.task('seedProjects', [project]);
      cy.task('seedVersions', [version]);
      cy.task('seedTraces', [collection]);
    });

    it('shows the correct trace count and zeros for open and axial code counters', () => {
      interceptVersionStats();
      visitOverviewPage();

      cy.wait('@getVersionStats').then((interception) => {
        const stats = interception.response?.body;

        cy.contains('Total Traces').next().should('contain.text', String(stats.versionTraceCount));

        cy.contains('Total Open codes').next().should('contain.text', '0');
        cy.contains('Total Axial codes').next().should('contain.text', '0');
      });
    });

    it('shows a dash for the largest axial code when there are no axial codes', () => {
      interceptVersionStats();
      visitOverviewPage();
      cy.wait('@getVersionStats');

      cy.contains('Largest Axial Code').next().should('contain.text', '—');
    });

    it('shows average open codes per axial code as zero', () => {
      interceptVersionStats();
      visitOverviewPage();
      cy.wait('@getVersionStats');

      cy.contains('Avg open codes per axial code').next().should('contain.text', '0');
    });

    it('does not show a treemap when there are no axial codes', () => {
      interceptVersionStats();
      visitOverviewPage();
      cy.wait('@getVersionStats');

      cy.contains('UX Friction').should('not.exist');
      cy.contains('Backend Latency').should('not.exist');
    });
  });

  // ---------------------------------------------------------------------------
  // Scenario: version with no data at all
  // ---------------------------------------------------------------------------
  context('with no data', () => {
    beforeEach(() => {
      cy.task('seedProjects', [project]);
      cy.task('seedVersions', [version]);
    });

    it('shows Statistics heading with all counters at zero', () => {
      interceptVersionStats();
      visitOverviewPage();
      cy.wait('@getVersionStats');

      cy.contains('Statistics').should('be.visible');
      cy.contains('Total Traces').next().should('contain.text', '0');
      cy.contains('Total Open codes').next().should('contain.text', '0');
      cy.contains('Total Axial codes').next().should('contain.text', '0');
    });
  });
});
