describe('view project versions', () => {
  const project = {
    projectId: 'de802ddc-d47a-426b-9ce5-f7b81fec0a49',
    userId: 'EC1145A3-869D-4B06-B4AE-7308D85839B7',
    name: 'Test Project',
    description: 'This is a test project',
  };

  const versions = [
    {
      versionId: 'b36c86c0-8db4-4b77-95d0-3f5d8e6a2d01',
      projectId: project.projectId,
      name: 'v1.0.0',
      description: 'Initial release',
    },
    {
      versionId: '3c9bdf2b-6f47-49aa-8cb6-642a17d6b68f',
      projectId: project.projectId,
      name: 'v1.1.0',
      description: 'Minor update',
    },
  ];

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

  beforeEach(() => {
    cy.task('seedProjects', [project]);
    cy.task('seedVersions', versions);
    cy.visit('');
  });

  it('shows the project versions in the sidebar and opens a version overview', () => {
    selectProject(project.name);

    cy.contains('Versions').should('be.visible');
    cy.contains('[role="button"]', versions[0].name).should('be.visible');
    cy.contains('[role="button"]', versions[1].name).should('be.visible');

    cy.contains('[role="button"]', versions[0].name).click();
    cy.contains('Overview').click();

    cy.url().should(
      'include',
      `/projects/${project.projectId}/versions/${versions[0].versionId}/overview`
    );
    cy.contains('Overview').should('be.visible');
  });
});
