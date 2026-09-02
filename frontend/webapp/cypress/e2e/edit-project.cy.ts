describe('edit project', () => {
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

  const openEditModal = (projectName: string) => {
    openProjectSelector();
    cy.get('[role="menu"]')
      .contains(projectName, { timeout: 10000 })
      .closest('[role="menuitem"]')
      .find('[aria-label="Edit project"]')
      .click();
  };

  // FON-TC-3: Change project name
  describe('Change project name [FON-TC-3]', () => {
    it('should successfully update the project name to a new name', () => {
      openEditModal(project.name);
      cy.get('#project-name').clear().type('New Project Name');
      cy.contains('Save project').click();
      openProjectSelector();
      cy.contains('New Project Name').should('exist');
      cy.contains(project.name).should('not.exist');
    });

    it('should NOT update the project name when left empty', () => {
      openEditModal(project.name);
      cy.get('#project-name').clear();
      cy.contains('Save project').should('be.disabled');
    });

    it('should successfully keep the project name when the same name is entered', () => {
      openEditModal(project.name);
      cy.get('#project-name').clear().type(project.name);
      cy.contains('Save project').click();
      openProjectSelector();
      cy.contains(project.name).should('exist');
    });
  });

  // FON-TC-4: Change project description
  describe('Change project description [FON-TC-4]', () => {
    it('should successfully update the project description to a new description', () => {
      openEditModal(project.name);
      cy.get('#project-desc').clear().type('New description');
      cy.contains('Save project').click();
      openEditModal(project.name);
      cy.contains('New description').should('exist');
      cy.get('#project-desc').should('have.value', 'New description');
    });

    it('should successfully save the project with an empty description', () => {
      openEditModal(project.name);
      cy.get('#project-desc').clear();
      cy.contains('Save project').click();
      openEditModal(project.name);
      cy.contains(project.name).should('exist');
      cy.get('#project-desc').should('have.value', '');
    });

    it('should successfully keep the project description when the same description is entered', () => {
      openEditModal(project.name);
      cy.get('#project-desc').clear().type(project.description);
      cy.contains('Save project').click();
      openEditModal(project.name);
      cy.contains(project.description).should('exist');
      cy.get('#project-desc').should('have.value', project.description);
    });
  });
});
