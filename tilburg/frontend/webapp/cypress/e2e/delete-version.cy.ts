describe('delete version', () => {
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
    cy.get('[role="dialog"]').should('be.visible');
  };

  const typeDeleteConfirmationName = (name: string) => {
    cy.get('[role="alertdialog"]')
      .find('input[placeholder="Version name"]')
      .should('be.visible')
      .clear()
      .type(name);
  };

  it('FON-TC-28: Confirmation popup appears', () => {
    const versionName = versions[0].name;

    // Given: The user opens the edit version modal
    openEditModal(versionName);

    // When: The user selects "Delete"
    cy.get('[role="dialog"]').within(() => {
      cy.contains('button', /^Delete$/).click();
    });

    // Then: A confirmation popup appears asking the user to confirm the deletion
    cy.get('[role="alertdialog"]').within(() => {
      cy.contains('Delete the version').should('be.visible');
      cy.contains('This will permanently remove this version').should('be.visible');
      cy.contains(`Type ${versionName} to confirm`).should('be.visible');
      cy.contains('button', /^Cancel$/).should('be.visible');
      cy.contains('button', /^Delete version$/).should('be.visible');
    });

    // And: Delete only becomes enabled after exact name match
    typeDeleteConfirmationName(versionName);
    cy.get('[role="alertdialog"]').within(() => {
      cy.contains('button', /^Delete version$/).should('be.enabled');
    });
  });

  it('FON-TC-29: Version is deleted after confirmation', () => {
    const versionToDelete = versions[0].name;
    const versionToKeep = versions[1].name;

    // Given: The confirmation popup is shown
    openEditModal(versionToDelete);
    cy.get('[role="dialog"]').within(() => {
      cy.contains('button', /^Delete$/).click();
    });

    // When: The user enters the exact version name and confirms deletion
    typeDeleteConfirmationName(versionToDelete);
    cy.get('[role="alertdialog"]', { timeout: 10000 })
      .should('be.visible')
      .within(() => {
        cy.contains('button', /^Delete version$/).click();
      });

    // Then: The version is deleted and user is redirected to the project page
    cy.get('[role="alertdialog"]').should('not.exist');
    cy.get('[role="dialog"]').should('not.exist');
    cy.location('pathname').should('eq', `/projects/${project.projectId}`);

    // And: The version no longer appears in the versions list
    cy.contains('[role="button"]', versionToDelete).should('not.exist');
    cy.contains('[role="button"]', versionToKeep).should('be.visible');
  });

  it('FON-TC-30: Version is not deleted after cancelling', () => {
    const versionToKeep = versions[0].name;
    const otherVersion = versions[1].name;

    // Given: The confirmation popup is shown
    openEditModal(versionToKeep);
    cy.get('[role="dialog"]').within(() => {
      cy.contains('button', /^Delete$/).click();
    });

    // When: The user cancels the deletion
    cy.get('[role="alertdialog"]', { timeout: 10000 })
      .should('be.visible')
      .within(() => {
        cy.contains('button', /^Cancel$/).click();
      });

    // Then: The version is not deleted
    cy.get('[role="alertdialog"]').should('not.exist');

    // Canceling the alert keeps the edit dialog open, so close it before checking sidebar buttons.
    cy.get('[role="dialog"]').within(() => {
      cy.contains('button', /^Cancel$/).click();
    });
    cy.get('[role="dialog"]').should('not.exist');

    // And: Both versions remain in the versions list
    cy.contains('[role="button"]', versionToKeep).should('be.visible');
    cy.contains('[role="button"]', otherVersion).should('be.visible');
  });

  it('FON-TC-31: Delete remains disabled when confirmation name is incorrect', () => {
    const versionName = versions[0].name;

    // Given: The confirmation popup is shown
    openEditModal(versionName);
    cy.get('[role="dialog"]').within(() => {
      cy.contains('button', /^Delete$/).click();
    });

    cy.get('[role="alertdialog"]', { timeout: 10000 }).should('be.visible');

    // When: The user types an incorrect version name
    typeDeleteConfirmationName(`${versionName}x`);

    // Then: Delete stays disabled
    cy.get('[role="alertdialog"]').within(() => {
      cy.contains('button', /^Delete version$/).should('be.disabled');
      cy.contains('Version name does not match.').should('be.visible');
    });

    // And: It is only enabled after an exact match
    typeDeleteConfirmationName(versionName);
    cy.get('[role="alertdialog"]').within(() => {
      cy.contains('button', /^Delete version$/).should('be.enabled');
    });
  });
});
