describe('LLM Config Modal', () => {
  beforeEach(() => {
    cy.visit('');
    cy.get('[aria-label="Configure LLM"]').click();
    cy.contains('LLM configuration').should('exist');
  });

  const clearInputs = () => {
    cy.get('#llm-provider').clear();
    cy.get('#llm-endpoint').clear();
    cy.get('#llm-model').clear();
  };

  it('validates partial inputs', () => {
    clearInputs();
    cy.get('#llm-provider').type('OpenAI');
    cy.contains('Provide a provider, endpoint, and model, or clear all fields.').should('exist');
    cy.contains('button', 'Save').should('be.disabled');
  });

  it('validates invalid endpoint URL', () => {
    clearInputs();
    cy.get('#llm-provider').type('OpenAI');
    cy.get('#llm-endpoint').type('not-a-url');
    cy.get('#llm-model').type('gpt-4');
    cy.contains('Endpoint must be a valid URL (including http/https).').should('exist');
    cy.contains('button', 'Save').should('be.disabled');
  });

  it('allows saving when all fields are filled correctly', () => {
    clearInputs();
    cy.get('#llm-provider').type('MyProvider');
    cy.get('#llm-endpoint').type('http://localhost:8080/');
    cy.get('#llm-model').type('my-model');
    cy.contains('button', 'Save').should('not.be.disabled').click();

    // Modal should close
    cy.contains('LLM configuration').should('not.exist');

    // Re-open and verify the saved values
    cy.get('[aria-label="Configure LLM"]').click();
    cy.get('#llm-provider').should('have.value', 'MyProvider');
    cy.get('#llm-endpoint').should('have.value', 'http://localhost:8080/');
    cy.get('#llm-model').should('have.value', 'my-model');
  });

  it('allows clearing all fields', () => {
    clearInputs();
    cy.contains('button', 'Save').should('not.be.disabled').click();
    cy.contains('LLM configuration').should('not.exist');

    // Re-open and verify fields are cleared
    cy.get('[aria-label="Configure LLM"]').click();
    cy.get('#llm-provider').should('have.value', '');
    cy.get('#llm-endpoint').should('have.value', '');
    cy.get('#llm-model').should('have.value', '');
  });

  it('resets to defaults', () => {
    cy.contains('button', 'Reset to default').click();

    cy.get('#llm-provider').should('have.value', 'ollama');
    cy.get('#llm-endpoint').should('have.value', 'http://localhost:11434/');
    cy.get('#llm-model').should('have.value', 'gpt-oss:120b-cloud');
  });
});
