//
// Not reimplemented
//

// describe('search traces', () => {
//   const project = {
//     projectId: 'de802ddc-d47a-426b-9ce5-f7b81fec0a49',
//     name: 'Test Project',
//     userId: 'EC1145A3-869D-4B06-B4AE-7308D85839B7',
//     description: 'This is a test project',
//   };
//
//   const projectVersion = {
//     versionId: 'b36c86c0-8db4-4b77-95d0-3f5d8e6a2d01',
//     projectId: project.projectId,
//     name: 'v1.0.0',
//     description: 'Initial release',
//   };
//
//   const buildCollection = () => ({
//     traceCollectionId: '00000000-1111-2222-3333-000000000001',
//     projectVersionId: projectVersion.versionId,
//     name: 'Search Collection',
//     createdAt: new Date().toISOString(),
//     traces: [
//       {
//         traceId: 'b1b2c3d4-0001-0000-0000-000000000001',
//         traceCollectionId: '00000000-1111-2222-3333-000000000001',
//         traceAttributes: [{ traceAttributeType: 0, key: 'model', value: 'gpt-4' }],
//         traceMessages: [
//           {
//             traceMessageType: 0,
//             index: 0,
//             role: 'user',
//             content: 'This trace contains the unique term apple-signal-123',
//           },
//           {
//             traceMessageType: 1,
//             index: 0,
//             role: 'assistant',
//             content: 'Assistant reply for apple-signal-123',
//           },
//         ],
//       },
//       {
//         traceId: 'b1b2c3d4-0001-0000-0000-000000000002',
//         traceCollectionId: '00000000-1111-2222-3333-000000000001',
//         traceAttributes: [{ traceAttributeType: 0, key: 'model', value: 'gpt-4' }],
//         traceMessages: [
//           {
//             traceMessageType: 0,
//             index: 0,
//             role: 'user',
//             content: 'This trace contains MiXeD CaSe ToKeN',
//           },
//           {
//             traceMessageType: 1,
//             index: 0,
//             role: 'assistant',
//             content: 'Assistant reply for MiXeD CaSe ToKeN',
//           },
//         ],
//       },
//     ],
//   });
//
//   const visitOverview = () => {
//     cy.visit(`/projects/${project.projectId}/versions/${projectVersion.versionId}/open-code`);
//   };
//
//   const searchInput = () => cy.get('input[placeholder="Search traces..."]');
//   const searchTypeDelayMs = 50;
//
//   const typeSearchQuery = (query: string) => {
//     searchInput().clear().type(query, { delay: searchTypeDelayMs });
//   };
//
//   beforeEach(() => {
//     cy.task('seedProjects', [project]);
//     cy.task('seedVersions', [projectVersion]);
//     cy.task('seedTraces', [buildCollection()]);
//     visitOverview();
//   });
//
//   it('shows the specific trace when searching', () => {
//     typeSearchQuery('apple-signal-123');
//     searchInput().should('have.value', 'apple-signal-123');
//
//     cy.contains('This trace contains the unique term apple-signal-123').should('be.visible');
//     cy.contains('This trace contains MiXeD CaSe ToKeN').should('not.exist');
//
//     cy.contains('This trace contains the unique term apple-signal-123').click();
//     cy.contains('Trace Id').should('be.visible');
//     cy.contains('b1b2c3d4-0001-0000-0000-000000000001').should('be.visible');
//   });
//
//   it('shows "No traces found" when nothing matches', () => {
//     typeSearchQuery('this-does-not-exist');
//     searchInput().should('have.value', 'this-does-not-exist');
//
//     cy.contains('No traces found.').should('be.visible');
//     cy.contains('Select a trace to view details').should('be.visible');
//   });
//
//   it('is not case sensitive', () => {
//     typeSearchQuery('mixed case token');
//     searchInput().should('have.value', 'mixed case token');
//
//     cy.contains('This trace contains MiXeD CaSe ToKeN').should('be.visible');
//     cy.contains('This trace contains the unique term apple-signal-123').should('not.exist');
//   });
//
//   it('keeps the search query in the input and in the URL', () => {
//     typeSearchQuery('apple-signal-123');
//     searchInput().should('have.value', 'apple-signal-123');
//
//     cy.location('search').should('include', 'q=apple-signal-123');
//   });
// });
