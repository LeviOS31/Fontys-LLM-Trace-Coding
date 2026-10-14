import { getPool } from './db';

export async function resetDb(): Promise<void> {
  const client = await getPool().connect();

  try {
    console.log('Cleaning DB...');

    await client.query(`
            TRUNCATE TABLE
              "Projects",
              "Versions",
              "SpanEventAttributes",
              "SpanEvent",
              "SpanAttributes",
              "TraceScopeSpans",
              "TraceScopes",
              "TraceResources",
              "Traces",
              "TraceGroups",
              "TraceCollections",
              "ChatClientConfigurations",
              "AssessmentCriterias",
              "AxialCodingResults",
              "JudgeTemplates"
            RESTART IDENTITY CASCADE;
    `);
  } finally {
    client.release();
    console.log('✅ Cleaning complete');
  }
}
