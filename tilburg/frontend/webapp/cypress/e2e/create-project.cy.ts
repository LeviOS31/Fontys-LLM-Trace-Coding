describe('Create project', () => {
  beforeEach(() => {
    cy.visit('');
    cy.contains('button', 'Add Project').click();
  });

  const scenarios = [
    { input: 'name', name: 'My Project', description: '', result: 'successfully' },
    {
      input: 'name and description',
      name: 'My Project',
      description: 'Some description',
      result: 'successfully',
    },
    { input: 'description', name: '', description: 'Some description', result: 'failed' },
    { input: 'nothing', name: '', description: '', result: 'failed' },
  ];

  scenarios.forEach(({ input, name, description, result }) => {
    it(`project creation is ${result} when entering ${input}`, () => {
      if (name) {
        cy.get('#project-name').type(name);
      }

      if (description) {
        cy.get('#project-desc').type(description);
      }

      if (result === 'successfully') {
        cy.contains('button', 'Create project').click();
        cy.contains('Create Project').should('not.exist');
      } else {
        cy.contains('button', 'Create project').should('be.disabled');
      }
    });
  });

  describe('Create project navigation (real E2E)', () => {
    it('navigates to created project page and shows data', () => {
      const name = `Project ${Date.now().toString(36)}`;
      const description = 'Some description';

      cy.wait(500);

      cy.get('#project-name').type(name);
      cy.get('#project-desc').type(description);
      cy.contains('button', 'Create project').click();

      cy.contains(name).should('exist');
      cy.contains(description).should('exist');
    });
  });
});
