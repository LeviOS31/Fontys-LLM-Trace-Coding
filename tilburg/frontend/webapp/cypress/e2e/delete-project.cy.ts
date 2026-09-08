describe('delete project', () => {
  const projects = [
    {
      projectId: 'de802ddc-d47a-426b-9ce5-f7b81fec0a49',
      userId: 'EC1145A3-869D-4B06-B4AE-7308D85839B7',
      name: 'Test Project',
      description: 'This is a test project',
    },
    {
      projectId: 'EC1145A3-869D-4B06-B4AE-7308D85839B8',
      userId: 'EC1145A3-869D-4B06-B4AE-7308D85839B7',
      name: 'Demo Project',
      description: 'This is a demo project',
    },
  ];

  beforeEach(() => {
    cy.task('seedProjects', projects);
    cy.visit('');
  });

  const openProjectSelector = () => {
    cy.get('[data-testid="project-selector"]').click();
  };

  const typeDeleteConfirmationName = (name: string) => {
    cy.get('[role="alertdialog"]')
      .find('input[placeholder="Project name"]')
      .should('be.visible')
      .clear()
      .type(name);
  };

  const openEditModal = (projectName: string) => {
    openProjectSelector();
    cy.get('[role="menu"]')
      .contains(projectName, { timeout: 10000 })
      .closest('[role="menuitem"]')
      .find('[aria-label="Edit project"]')
      .click();

    cy.get('[role="dialog"]').should('be.visible');
  };

  it('FON-TC-12: Confirmation popup appears', () => {
    const projectName = projects[0].name;

    // Given: The user opens the three-dots menu of a project
    openEditModal(projectName);

    // When: The user selects "Delete project"
    cy.get('[role="dialog"]').within(() => {
      cy.contains('button', /^Delete$/).click();
    });

    // Then: A confirmation popup appears asking the user to confirm the deletion
    cy.get('[role="alertdialog"]').within(() => {
      cy.contains('Delete the project').should('be.visible');
      cy.contains('This will permanently remove the project and all its data').should('be.visible');
      cy.contains(`Type ${projectName} to confirm`).should('be.visible');
      cy.contains('button', /^Cancel$/).should('be.visible');
      cy.contains('button', /^Delete project$/).should('be.visible');
    });
    // And: Delete only becomes enabled after exact name match
    typeDeleteConfirmationName(projectName);
    cy.get('[role="alertdialog"]').within(() => {
      cy.contains('button', /^Delete project$/).should('be.enabled');
    });
  });

  it('FON-TC-13: Project is deleted after confirmation', () => {
    const projectToDelete = projects[0].name;
    const projectToKeep = projects[1].name;

    // Given: The confirmation popup is shown
    openEditModal(projectToDelete);

    cy.get('[role="dialog"]').within(() => {
      cy.contains('button', /^Delete$/).click();
    });

    // When: The user enters the exact project name and confirms deletion
    typeDeleteConfirmationName(projectToDelete);
    cy.get('[role="alertdialog"]', { timeout: 10000 })
      .should('be.visible')
      .within(() => {
        cy.contains('button', /^Delete project$/).click();
      });

    // Then: The project is deleted
    cy.get('[role="alertdialog"]').should('not.exist');
    cy.get('[role="dialog"]', { timeout: 10000 }).should('not.exist');

    // And: The project no longer appears in the project list
    openProjectSelector();
    cy.contains(projectToDelete).should('not.exist');
    cy.contains(projectToKeep, { timeout: 10000 }).should('be.visible');
  });

  it('FON-TC-14: Project is not deleted after cancelling', () => {
    const projectToKeep = projects[0].name;
    const otherProject = projects[1].name;

    // Given: The confirmation popup is shown
    openEditModal(projectToKeep);

    cy.get('[role="dialog"]').within(() => {
      cy.contains('button', /^Delete$/).click();
    });

    // When: The user cancels the deletion
    cy.get('[role="alertdialog"]', { timeout: 10000 })
      .should('be.visible')
      .within(() => {
        cy.contains('button', /^Cancel$/).click();
      });

    // Then: The project is not deleted
    cy.get('[role="alertdialog"]').should('not.exist');

    // Canceling the alert keeps the edit dialog open, so close it before interacting with the selector.
    cy.get('[role="dialog"]').within(() => {
      cy.contains('button', /^Cancel$/).click();
    });
    cy.get('[role="dialog"]').should('not.exist');

    // And: The project remains in the project list
    openProjectSelector();
    cy.contains(projectToKeep, { timeout: 10000 }).should('be.visible');
    cy.contains(otherProject, { timeout: 10000 }).should('be.visible');
  });

  it('FON-TC-15: Delete remains disabled when confirmation name is incorrect', () => {
    const projectName = projects[0].name;

    // Given: The confirmation popup is shown
    openEditModal(projectName);
    cy.get('[role="dialog"]').within(() => {
      cy.contains('button', /^Delete$/).click();
    });

    cy.get('[role="alertdialog"]', { timeout: 10000 }).should('be.visible');

    // When: The user types an incorrect project name
    typeDeleteConfirmationName(`${projectName}x`);

    // Then: Delete stays disabled
    cy.get('[role="alertdialog"]').within(() => {
      cy.contains('button', /^Delete project$/).should('be.disabled');
      cy.contains('Project name does not match.').should('be.visible');
    });

    // And: It is only enabled after an exact match
    typeDeleteConfirmationName(projectName);
    cy.get('[role="alertdialog"]').within(() => {
      cy.contains('button', /^Delete project$/).should('be.enabled');
    });
  });
});
