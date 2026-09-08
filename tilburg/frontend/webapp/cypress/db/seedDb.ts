import { getPool } from './db';
import { Project } from '../../src/shared/types/project';
import { Version } from '../../src/shared/types/version';
import { TraceCollection } from '../../src/shared/types/trace';

export interface SeedOpenCode {
  openCodeId: string;
  traceId: string;
  openCodeValue: string;
  axialCodeId?: string;
}

export async function seedDb(): Promise<void> {
  const client = await getPool().connect();

  try {
    console.log('Seeding database...');

    // Add seed queries here
    await client.query(
      `INSERT INTO "ChatClientConfigurations" ("UserId", "Provider", "Endpoint", "Model") VALUES ($1, $2, $3, $4)`,
      ['ec1145a3-869d-4b06-b4ae-7308d85839b7', 'ollama', 'http://localhost:14344', 'gpt-5']
    );

    console.log('✅ Seed complete');
  } finally {
    client.release();
  }
}

export async function seedProjects(projects: Project[]): Promise<void> {
  const client = await getPool().connect();
  try {
    for (const project of projects) {
      await client.query(
        `INSERT INTO "Projects" ("ProjectId", "UserId", "Name", "Description") VALUES ($1, $2, $3, $4)`,
        [project.projectId, project.userId, project.name, project.description]
      );
    }
    console.log('✅ Projects seeded');
  } finally {
    client.release();
  }
}

export async function seedVersions(versions: Version[]): Promise<void> {
  const client = await getPool().connect();
  try {
    for (const version of versions) {
      await client.query(
        `INSERT INTO "Versions" ("VersionId", "ProjectId", "Name", "Description") VALUES ($1, $2, $3, $4)`,
        [version.versionId, version.projectId, version.name, version.description]
      );
    }
    console.log('✅ Versions seeded');
  } finally {
    client.release();
  }
}

export async function seedTraces(collections: TraceCollection[]): Promise<void> {
  const client = await getPool().connect();

  try {
    await client.query('BEGIN');

    for (const collection of collections) {
      await client.query(
        `INSERT INTO "TraceCollections" ("TraceCollectionId", "ProjectVersionId", "Name", "CreatedAt") VALUES ($1, $2, $3, $4)`,
        [
          collection.traceCollectionId,
          collection.projectVersionId,
          collection.name,
          collection.createdAt,
        ]
      );

      for (const trace of collection.traces) {
        // Check if the trace group exists
        const traceGroup = await client.query(
          `SELECT * FROM "TraceGroups" WHERE "TraceGroupId" = $1`,
          [trace.traceGroupId]
        );
        if (traceGroup.rowCount === 0) {
          await client.query(
            `INSERT INTO "TraceGroups" ("TraceGroupId", "TraceGroupType") VALUES ($1, $2)`,
            [trace.traceGroupId, 0]
          );
        }

        await client.query(
          `INSERT INTO "Traces" ("TraceId", "TraceCollectionId", "TraceGroupId") VALUES ($1, $2, $3)`,
          [trace.traceId, trace.traceCollectionId, trace.traceGroupId]
        );

        for (const resource of trace.traceResources) {
          await client.query(
            `INSERT INTO "TraceResources" ("TraceId", "Key", "Value", "TraceAttributeType") VALUES ($1, $2, $3, $4)`,
            [trace.traceId, resource.key, resource.value, resource.attributeType]
          );
        }

        for (const scope of trace.traceScopes) {
          await client.query(
            `INSERT INTO "TraceScopes" ("TraceScopeId", "Name", "Version", "TraceId") VALUES ($1, $2, $3, $4)`,
            [scope.scopeId, scope.name, scope.version, trace.traceId]
          );

          for (const span of scope.spans) {
            await client.query(
              `INSERT INTO "TraceScopeSpans" ("TraceScopeSpanId", "TraceScopeId", "ParentSpanId", "Name", "StartTimeUnixNano", "EndTimeUnixNano", "SpanKind") VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [
                span.spanId,
                scope.scopeId,
                span.parentSpanId ?? null,
                span.name,
                span.startTimeUnixNano,
                span.endTimeUnixNano,
                span.spanKind,
              ]
            );

            for (const attribute of span.attributes) {
              await client.query(
                `INSERT INTO "SpanAttributes" ("SpanId", "Key", "Value", "TraceAttributeType") VALUES ($1, $2, $3, $4)`,
                [span.spanId, attribute.key, attribute.value, attribute.attributeType]
              );
            }

            for (const event of span.events) {
              await client.query(
                `INSERT INTO "SpanEvent" ("EventId", "SpanId", "TimeUnixNano", "Name") VALUES ($1, $2, $3, $4)`,
                [event.eventId, span.spanId, event.timeUnixNano, event.name]
              );

              for (const eventAttribute of event.attributes) {
                await client.query(
                  `INSERT INTO "SpanEventAttributes" ("SpanEventId", "Key", "Value", "TraceAttributeType") VALUES ($1, $2, $3, $4)`,
                  [
                    event.eventId,
                    eventAttribute.key,
                    eventAttribute.value,
                    eventAttribute.attributeType,
                  ]
                );
              }
            }
          }
        }
      }
    }

    await client.query('COMMIT');
    console.log('✅ Traces seeded');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export interface SeedAxialCode {
  axialCodeId: string;
  label: string;
  description: string;
  traceIds: string[];
}

export interface SeedAxialCodingResult {
  axialCodingResultId: string;
  projectVersionId: string;
  isActive: boolean;
  createdAt: string;
  axialCodes: SeedAxialCode[];
}

export async function seedAxialCodingResults(results: SeedAxialCodingResult[]): Promise<void> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    for (const result of results) {
      await client.query(
        `INSERT INTO "AxialCodingResults" ("AxialCodingResultId", "ProjectVersionId", "IsActive", "CreatedAt") VALUES ($1, $2, $3, $4)`,
        [result.axialCodingResultId, result.projectVersionId, result.isActive, result.createdAt]
      );
      for (const code of result.axialCodes) {
        await client.query(
          `INSERT INTO "AxialCode" ("AxialCodeId", "AxialCodingResultId", "Label", "Description", "TraceIds") VALUES ($1, $2, $3, $4, $5::uuid[])`,
          [
            code.axialCodeId,
            result.axialCodingResultId,
            code.label,
            code.description,
            code.traceIds,
          ]
        );
      }
    }
    await client.query('COMMIT');
    console.log('✅ AxialCodingResults seeded');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export interface SeedJudgeTemplate {
  judgeTemplateId: string;
  judgeTemplateName: string;
  judgeTemplateDescription: string;
  axialCodeId: string;
  projectId: string;
  projectVersionId: string;
  isDeprecated?: boolean;
}

export async function seedJudgeTemplates(templates: SeedJudgeTemplate[]): Promise<void> {
  const client = await getPool().connect();
  try {
    for (const t of templates) {
      await client.query(
        `INSERT INTO "JudgeTemplates" ("JudgeTemplateId", "JudgeTemplateName", "JudgeTemplateDescription", "AxialCodeId", "ProjectId", "ProjectVersionId", "IsDeprecated") VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          t.judgeTemplateId,
          t.judgeTemplateName,
          t.judgeTemplateDescription,
          t.axialCodeId,
          t.projectId,
          t.projectVersionId,
          t.isDeprecated ?? false,
        ]
      );
    }
    console.log('✅ JudgeTemplates seeded');
  } finally {
    client.release();
  }
}

export async function seedOpenCodes(openCodes: SeedOpenCode[]): Promise<void> {
  const client = await getPool().connect();
  try {
    for (const openCode of openCodes) {
      await client.query(
        `UPDATE "Traces" SET "OpenCode" = $1, "AxialCodeId" = $2 WHERE "TraceId" = $3`,
        [openCode.openCodeValue, openCode.axialCodeId ?? null, openCode.traceId]
      );
    }
    console.log('✅ OpenCodes seeded');
  } finally {
    client.release();
  }
}
