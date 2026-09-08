import { getPool } from './db';

export async function resetDb(): Promise<void> {
  console.log(process.env.TEST_DATABASE_URL);

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
              "AssessmentCriteria",
              "AxialCodingResults",
              "JudgeTemplates"
            RESTART IDENTITY CASCADE;
    `);
  } finally {
    client.release();
    console.log('✅ Cleaning complete');
  }
}
