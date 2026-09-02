describe('get project', () => {
  const project = {
    projectId: 'de802ddc-d47a-426b-9ce5-f7b81fec0a49',
    userId: 'EC1145A3-869D-4B06-B4AE-7308D85839B7',
    name: 'Test Project',
    description: 'This is a test project',
  };

  const openProjectSelector = () => {
    cy.get('[data-testid="project-selector"]').click();
  };

  context('With existing projects in the database', () => {
    beforeEach(() => {
      cy.task('seedProjects', [project]);
      cy.visit('');
      openProjectSelector();
    });

    it('selects an existing project and opens the project overview', () => {
      cy.contains(project.name).click();

      cy.url().should('include', '/projects');
      cy.contains(project.name).should('be.visible');
      cy.contains(project.description).should('be.visible');
    });
  });
});
