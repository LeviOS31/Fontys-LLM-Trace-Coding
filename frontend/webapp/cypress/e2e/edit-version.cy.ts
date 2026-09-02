describe('edit version', () => {
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

  beforeEach(() => {
    cy.task('seedProjects', [project]);
    cy.task('seedVersions', versions);
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

  const openVersionOverview = (versionName: string) => {
    selectProject(project.name);
    cy.contains('[role="button"]', versionName).click();
    cy.contains('Overview').click();
  };

  const openEditModal = (versionName: string) => {
    openVersionOverview(versionName);
    cy.contains('button', 'Edit version').click();
  };

  describe('Change version name', () => {
    it('should successfully update the version name to a new name', () => {
      const newVersionName = 'v1.0.1';

      openEditModal(versions[0].name);
      cy.get('#version-name').clear().type(newVersionName);
      cy.contains('Save version').click();

      cy.contains('button', 'Edit version').click();
      cy.get('#version-name').should('have.value', newVersionName);
      cy.get('#version-desc').should('have.value', versions[0].description);
    });

    it('should NOT update the version name when left empty', () => {
      openEditModal(versions[0].name);
      cy.get('#version-name').clear();
      cy.contains('Save version').should('be.disabled');
    });

    it('should show a 409 error when setting a duplicate version name', () => {
      openEditModal(versions[0].name);
      cy.get('#version-name').clear().type(versions[1].name);
      cy.contains('Save version').click();

      cy.contains('There already exists a version with this name within this project.').should(
        'be.visible'
      );
      cy.get('[role="dialog"]').should('be.visible');
    });

    it('should successfully keep the version name when the same name is entered', () => {
      openEditModal(versions[0].name);
      cy.get('#version-name').clear().type(versions[0].name);
      cy.contains('Save version').click();

      cy.contains('button', 'Edit version').click();
      cy.get('#version-name').should('have.value', versions[0].name);
    });
  });

  describe('Change version description', () => {
    it('should successfully update the version description to a new description', () => {
      const newDescription = 'Updated release notes';

      openEditModal(versions[0].name);
      cy.get('#version-desc').clear().type(newDescription);
      cy.contains('Save version').click();

      cy.contains('button', 'Edit version').click();
      cy.get('#version-desc').should('have.value', newDescription);
      cy.get('#version-name').should('have.value', versions[0].name);
    });

    it('should NOT update the version when description is left empty', () => {
      openEditModal(versions[0].name);
      cy.get('#version-desc').clear();
      cy.contains('Save version').should('be.disabled');
    });

    it('should successfully keep the version description when the same description is entered', () => {
      openEditModal(versions[0].name);
      cy.get('#version-desc').clear().type(versions[0].description);
      cy.contains('Save version').click();

      cy.contains('button', 'Edit version').click();
      cy.get('#version-desc').should('have.value', versions[0].description);
    });
  });
});
