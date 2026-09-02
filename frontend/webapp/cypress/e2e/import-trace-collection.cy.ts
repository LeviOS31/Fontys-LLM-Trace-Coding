describe('import trace collection', () => {
  const project = {
    projectId: 'de802ddc-d47a-426b-9ce5-f7b81fec0a49',
    name: 'Trace Import Project',
    userId: 'EC1145A3-869D-4B06-B4AE-7308D85839B7',
    description: 'Project used for trace import e2e',
  };

  const projectVersion = {
    versionId: 'b36c86c0-8db4-4b77-95d0-3f5d8e6a2d01',
    projectId: project.projectId,
    name: 'v1.0.0',
    description: 'Initial release',
  };

  const traceFilePath = 'cypress/testData/opentelemetry_traces_example 3.jsonl';

  const visitTracesPage = () => {
    cy.visit(`/projects/${project.projectId}/versions/${projectVersion.versionId}/open-code`);
  };

  const visitVersionHomePage = () => {
    cy.visit(`/projects/${project.projectId}/versions/${projectVersion.versionId}/overview`);
  };
  const openImportModal = () => {
    cy.contains('button', 'Import trace collection').click();
    cy.contains('Import Trace Collection').should('be.visible');
  };

  const getModalSubmitButton = () =>
    cy.get('[role="dialog"]').contains('button', 'Import trace collection');

  beforeEach(() => {
    cy.task('seedProjects', [project]);
    cy.task('seedVersions', [projectVersion]);
  });

  // ---------------------------------------------------------------------------
  // Empty state pre-condition
  // ---------------------------------------------------------------------------
  context('before any import', () => {
    beforeEach(() => {
      visitTracesPage();
    });

    it('shows "No traces found" on a fresh version', () => {
      cy.contains('No trace groups found').should('be.visible');
    });
  });

  // ---------------------------------------------------------------------------
  // Modal behaviour Traces Page
  // ---------------------------------------------------------------------------
  context('import modal traces page', () => {
    beforeEach(() => {
      visitTracesPage();
    });

    it('opens when the Import trace collection button is clicked', () => {
      openImportModal();
      cy.contains('Import Trace Collection').should('be.visible');
      cy.contains('Upload a trace file to import all the traces in the current version.').should(
        'be.visible'
      );
    });

    it('opens when the I keyboard shortcut is pressed', () => {
      cy.get('body').click();
      cy.wait(500);
      cy.get('body').type('i');
      cy.contains('Import Trace Collection').should('be.visible');
    });

    it('closes when Cancel is clicked', () => {
      openImportModal();
      cy.contains('button', 'Cancel').click();
      cy.contains('Import Trace Collection').should('not.exist');
    });

    it('closes when Escape is pressed', () => {
      openImportModal();
      cy.get('body').type('{esc}');
      cy.contains('Import Trace Collection').should('not.exist');
    });

    it('keeps the Import button disabled until both name and file are provided', () => {
      openImportModal();
      // Both empty → disabled
      getModalSubmitButton().should('have.attr', 'disabled');

      // Name only → still disabled
      cy.get('#trace-collection-name').type('My Collection');
      getModalSubmitButton().should('have.attr', 'disabled');

      // File added → enabled
      cy.get('#trace-file').selectFile(traceFilePath, { force: true });
      getModalSubmitButton().should('not.have.attr', 'disabled');
    });

    it('pre-fills the name field from the selected filename', () => {
      openImportModal();
      cy.get('#trace-file').selectFile(traceFilePath, { force: true });
      cy.get('#trace-collection-name').should('not.have.value', '');
    });

    it('resets form fields when the modal is reopened', () => {
      openImportModal();
      cy.get('#trace-collection-name').type('Temporary Name');
      cy.contains('button', 'Cancel').click();

      openImportModal();
      cy.get('#trace-collection-name').should('have.value', '');
    });

    it('keeps the Import button disabled when name is below minimum length', () => {
      openImportModal();
      cy.get('#trace-file').selectFile(traceFilePath, { force: true });

      // Type a name that is too short
      cy.get('#trace-collection-name').clear().type('A');
      getModalSubmitButton().should('have.attr', 'disabled');

      // Error hint should be visible
      cy.contains('min').should('be.visible');

      // Type enough characters to meet the minimum → button enables
      cy.get('#trace-collection-name').clear().type('Valid Name');
      getModalSubmitButton().should('not.have.attr', 'disabled');
    });
  });

  // ---------------------------------------------------------------------------
  // Modal behaviour Version Page Page
  // ---------------------------------------------------------------------------
  context('import modal version page', () => {
    beforeEach(() => {
      visitVersionHomePage();
    });

    it('opens when the Import trace collection button is clicked', () => {
      openImportModal();
      cy.contains('Import Trace Collection').should('be.visible');
      cy.contains('Upload a trace file to import all the traces in the current version.').should(
        'be.visible'
      );
    });

    it('opens when the I keyboard shortcut is pressed', () => {
      cy.get('body').click();
      cy.wait(500);
      cy.get('body').type('i');
      cy.contains('Import Trace Collection').should('be.visible');
    });

    it('closes when Cancel is clicked', () => {
      openImportModal();
      cy.contains('button', 'Cancel').click();
      cy.contains('Import Trace Collection').should('not.exist');
    });

    it('closes when Escape is pressed', () => {
      openImportModal();
      cy.get('body').type('{esc}');
      cy.contains('Import Trace Collection').should('not.exist');
    });

    it('keeps the Import button disabled until both name and file are provided', () => {
      openImportModal();
      // Both empty → disabled
      getModalSubmitButton().should('have.attr', 'disabled');

      // Name only → still disabled
      cy.get('#trace-collection-name').type('My Collection');
      getModalSubmitButton().should('have.attr', 'disabled');

      // File added → enabled
      cy.get('#trace-file').selectFile(traceFilePath, { force: true });
      getModalSubmitButton().should('not.have.attr', 'disabled');
    });

    it('pre-fills the name field from the selected filename', () => {
      openImportModal();
      cy.get('#trace-file').selectFile(traceFilePath, { force: true });
      cy.get('#trace-collection-name').should('not.have.value', '');
    });

    it('resets form fields when the modal is reopened', () => {
      openImportModal();
      cy.get('#trace-collection-name').type('Temporary Name');
      cy.contains('button', 'Cancel').click();

      openImportModal();
      cy.get('#trace-collection-name').should('have.value', '');
    });

    it('keeps the Import button disabled when name is below minimum length', () => {
      openImportModal();
      cy.get('#trace-file').selectFile(traceFilePath, { force: true });

      // Type a name that is too short
      cy.get('#trace-collection-name').clear().type('A');
      getModalSubmitButton().should('have.attr', 'disabled');

      // Error hint should be visible
      cy.contains('min').should('be.visible');

      // Type enough characters to meet the minimum → button enables
      cy.get('#trace-collection-name').clear().type('Valid Name');
      getModalSubmitButton().should('not.have.attr', 'disabled');
    });
    // ---------------------------------------------------------------------------
    // Successful import Traces Page
    // ---------------------------------------------------------------------------
  });

  context('when a valid file is imported on TracesPage', () => {
    beforeEach(() => {
      visitTracesPage();
      cy.intercept(
        'POST',
        `/v1/projects/${project.projectId}/versions/${projectVersion.versionId}/traces`
      ).as('importTraces');
    });

    it('submits the form, closes the modal and shows imported traces', () => {
      openImportModal();

      cy.get('#trace-collection-name').clear().type('OpenTelemetry Sample');
      cy.get('#trace-file').selectFile(traceFilePath, { force: true });

      getModalSubmitButton().click();

      cy.wait('@importTraces').its('response.statusCode').should('be.oneOf', [200, 201]);

      cy.contains('Import Trace Collection').should('not.exist');
      cy.contains('No traces found').should('not.exist');
      cy.contains('rag-pipeline').should('be.visible');
    });
    // ---------------------------------------------------------------------------
    // Successful import
    // ---------------------------------------------------------------------------
    it('submits via Ctrl+Enter keyboard shortcut', () => {
      openImportModal();

      cy.get('#trace-collection-name').clear().type('OpenTelemetry Sample');
      cy.get('#trace-file').selectFile(traceFilePath, { force: true });

      cy.get('#trace-collection-name').type('{ctrl+enter}');

      cy.wait('@importTraces').its('response.statusCode').should('be.oneOf', [200, 201]);
      cy.contains('Import Trace Collection').should('not.exist');
    });
  });
});
