describe('LLM chat content', () => {
  const projectId = 'de802ddc-d47a-426b-9ce5-f7b81fec0a55';
  const versionId = 'cc6c86c0-8db4-4b77-95d0-3f5d8e6a2d55';
  const collectionId = '00000000-1111-2222-3333-000000000055';
  const traceGroupId = '00000000-1111-2222-3333-000000000056';
  const traceId = '03300000-1111-2222-3333-000000000055';
  const rootSpanId = '00000000-1111-2222-3333-000000000057';
  const llmSpanId = '00000000-1111-2222-3333-000000000058';
  const retrievalSpanId = '00000000-1111-2222-3333-000000000059';

  const project = {
    projectId,
    name: 'LLM Chat E2E Project',
    description: 'Project for LLM chat e2e tests',
    userId: 'EC1145A3-869D-4B06-B4AE-7308D85839B7',
  };

  const version = {
    versionId,
    projectId,
    name: 'LLM Chat Test Version',
    description: 'Version for LLM chat e2e tests',
  };

  const collection = {
    traceCollectionId: collectionId,
    projectVersionId: versionId,
    name: 'LLM Chat Collection',
    createdAt: new Date().toISOString(),
    traces: [
      {
        traceGroupId,
        traceId,
        traceCollectionId: collectionId,
        traceResources: [{ key: 'service.name', value: 'LLM E2E Service', attributeType: 0 }],
        traceScopes: [
          {
            scopeId: '00000000-1111-2222-3333-000000000060',
            name: 'LLM E2E Scope',
            version: '1.0.0',
            spans: [
              {
                spanId: rootSpanId,
                parentSpanId: null,
                name: 'request',
                startTimeUnixNano: 1,
                endTimeUnixNano: 4,
                spanKind: 1,
                attributes: [],
                events: [],
              },
              {
                spanId: llmSpanId,
                parentSpanId: rootSpanId,
                name: 'chat completion',
                startTimeUnixNano: 2,
                endTimeUnixNano: 3,
                spanKind: 3,
                attributes: [
                  {
                    key: 'gen_ai.input.messages',
                    value: JSON.stringify([{ role: 'user', content: 'Summarize this source' }]),
                    attributeType: 0,
                  },
                  {
                    key: 'gen_ai.output.messages',
                    value: JSON.stringify([
                      {
                        role: 'assistant',
                        content: '**A concise summary** based on the source.',
                      },
                    ]),
                    attributeType: 0,
                  },
                  { key: 'gen_ai.request.model', value: 'e2e-model', attributeType: 0 },
                ],
                events: [],
              },
              {
                spanId: retrievalSpanId,
                parentSpanId: rootSpanId,
                name: 'document retrieval',
                startTimeUnixNano: 1,
                endTimeUnixNano: 2,
                spanKind: 1,
                attributes: [
                  { key: 'gen_ai.operation.name', value: 'retrieval', attributeType: 0 },
                  {
                    key: 'gen_ai.retrieval.query.text',
                    value: 'Summarize this source',
                    attributeType: 0,
                  },
                  {
                    key: 'rag.retrieval.evidence',
                    value: JSON.stringify([
                      {
                        id: 'e2e-chunk-1',
                        source_file: 'docs/llm-guide.md',
                        content: 'This is the retrieved evidence shown in the chat.',
                        used_for_generation: true,
                        score: 0.91,
                      },
                    ]),
                    attributeType: 0,
                  },
                ],
                events: [],
              },
            ],
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    cy.task('seedProjects', [project]);
    cy.task('seedVersions', [version]);
    cy.task('seedTraces', [collection]);
    cy.visit(`/projects/${projectId}/versions/${versionId}/open-code/${traceGroupId}`);
  });

  it('renders the LLM conversation and opens retrieved source evidence', () => {
    cy.contains('LLM chat interaction').should('be.visible');
    cy.contains('Summarize this source').should('be.visible');
    cy.contains('A concise summary').should('be.visible');
    cy.contains('E2E-MODEL').should('be.visible');

    cy.contains('button', 'docs/llm-guide.md').click();
    cy.get('[role="dialog"]').within(() => {
      cy.contains('Retrieved source content').should('be.visible');
      cy.contains('This is the retrieved evidence shown in the chat.').should('be.visible');
      cy.contains('Used for generation').should('be.visible');
      cy.contains('Score: 0.910').should('be.visible');
    });

    cy.get('[role="dialog"]').trigger('keydown', { key: 'Escape', code: 'Escape' });
    cy.get('[role="dialog"]').should('not.exist');
  });
});
