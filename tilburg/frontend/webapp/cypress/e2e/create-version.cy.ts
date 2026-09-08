describe('Create version', () => {
  const project = {
    projectId: 'de802ddc-d47a-426b-9ce5-f7b81fec0a49',
    userId: 'EC1145A3-869D-4B06-B4AE-7308D85839B7',
    name: 'Test Project',
    description: 'This is a test project',
  };

  beforeEach(() => {
    cy.task('seedProjects', [project]);
    cy.visit('');
  });

  const openProjectSelector = () => {
    cy.get('[data-testid="project-selector"]').click();
  };

  const selectProject = (projectName: string) => {
    openProjectSelector();
    cy.get('[role="menu"]')
      .contains(projectName, { timeout: 10000 })
      .closest('[role="menuitem"]')
      .click();
  };

  const openCreateVersionModal = () => {
    cy.contains('button', 'New version').click();
  };

  it('version creation is successful when entering name and description', () => {
    selectProject(project.name);

    cy.wait(500);

    openCreateVersionModal();

    cy.get('#version-name').type('v1.0.0');
    cy.get('#project-desc').type('Initial release');

    cy.contains('button', 'Create version').click();
    cy.contains('Create new version').should('not.exist');
  });

  it('version creation is failed when description is missing', () => {
    selectProject(project.name);

    cy.wait(500);

    openCreateVersionModal();

    cy.get('#version-name').type('v1.0.0');
    // Description is required, so button should be disabled
    cy.contains('button', 'Create version').should('be.disabled');
  });

  it('version creation is failed when version name is too short', () => {
    selectProject(project.name);

    cy.wait(500);

    openCreateVersionModal();

    cy.get('#version-name').type('v');
    cy.get('#project-desc').type('Some description');

    cy.contains('button', 'Create version').should('be.disabled');
  });

  it('shows 409 error when version name already exists', () => {
    selectProject(project.name);

    cy.wait(500);

    openCreateVersionModal();

    const versionName = `v${Date.now().toString(36)}`;
    const versionDescription = 'Test version description';

    // Create the first version
    cy.get('#version-name').type(versionName);
    cy.get('#project-desc').type(versionDescription);
    cy.contains('button', 'Create version').click();

    // Verify the version was created
    cy.url().should('include', '/versions/');

    // Navigate back to project page to attempt creating duplicate
    cy.visit(`/projects/${project.projectId}`);
    cy.wait(500);

    openCreateVersionModal();

    // Try to create duplicate version with same name
    cy.get('#version-name').type(versionName);
    cy.get('#project-desc').type('Different description');
    cy.contains('button', 'Create version').click();

    // Verify 409 error message appears
    cy.contains('There already exists a version with this name within this project.').should(
      'be.visible'
    );

    // Verify modal stays open for retry
    cy.get('[role="dialog"]').should('be.visible');
  });

  describe('Create version navigation (real E2E)', () => {
    it('navigates to created version page and shows data', () => {
      selectProject(project.name);

      cy.wait(500);

      openCreateVersionModal();

      const versionName = `v${Date.now().toString(36)}`;
      const versionDescription = 'Test version description';

      cy.get('#version-name').type(versionName);
      cy.get('#project-desc').type(versionDescription);

      cy.contains('button', 'Create version').click();

      // Verify navigation to version overview page
      cy.url().should('include', '/versions/');
      cy.url().should('include', '/overview');

      // Verify the version name and description are displayed
      cy.contains(versionName).should('exist');
      cy.contains(versionDescription).should('exist');
    });
  });
});
