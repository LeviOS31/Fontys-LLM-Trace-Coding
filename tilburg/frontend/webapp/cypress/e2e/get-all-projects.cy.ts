describe('get all projects', () => {
  const project = {
    projectId: 'de802ddc-d47a-426b-9ce5-f7b81fec0a49',
    userId: 'EC1145A3-869D-4B06-B4AE-7308D85839B7',
    name: 'Test Project',
    description: 'This is a test project',
  };

  const openProjectSelector = () => {
    cy.get('[data-testid="project-selector"]').click();
  };

  context('No projects in the database [FON-TC-39]', () => {
    beforeEach(() => {
      cy.visit('');
    });

    it('shows "Add Project" button instead of a dropdown', () => {
      cy.contains('button', 'Add Project').should('be.visible');
      cy.contains('button', 'Select a project').should('not.exist');
    });
  });

  context('With existing projects in the database [FON-TC-38]', () => {
    beforeEach(() => {
      cy.task('seedProjects', [project]);
      cy.visit('');
      openProjectSelector();
    });

    it('displays the existing project in the dropdown', () => {
      cy.contains(project.name).should('be.visible');
    });
  });
});
