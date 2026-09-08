import { readFileSync, writeFileSync } from "fs";

type Schema = {
  $ref?: string;
  type?: string | string[];
  properties?: Record<string, Schema>;
  required?: string[];
  items?: Schema;
  anyOf?: Schema[];
  oneOf?: Schema[];
  enum?: string[];
  const?: string;
};

type OpenApiSpec = {
  components?: { schemas?: Record<string, Schema> };
  paths?: Record<
    string,
    Record<
      string,
      {
        responses?: Record<
          string,
          { content?: { "application/json"?: { schema?: Schema } } }
        >;
      }
    >
  >;
};

const spec: OpenApiSpec = JSON.parse(
  readFileSync("openapi.clean.json", "utf-8"),
);
const refs: Record<string, Schema> = spec.components?.schemas ?? {};

function toTsType(schema: Schema, depth = 0): string {
  if (depth > 10) return "unknown";

  if (schema.$ref) {
    const name = schema.$ref.split("/").at(-1)!;
    return name in refs ? name : "unknown";
  }

  if (schema.anyOf)
    return schema.anyOf.map((s) => toTsType(s, depth)).join(" | ");
  if (schema.oneOf)
    return schema.oneOf.map((s) => toTsType(s, depth)).join(" | ");

  const t = schema.type;

  if (t === "array") return `(${toTsType(schema.items ?? {}, depth)})[]`;

  if (t === "object" || schema.properties) {
    const props = schema.properties ?? {};
    const required = schema.required ?? [];
    if (!Object.keys(props).length) return "Record<string, unknown>";
    const pad = "  ".repeat(depth + 1);
    const close = "  ".repeat(depth);
    const lines = [
      "{",
      ...Object.entries(props).map(([k, v]) => {
        const opt = required.includes(k) ? "" : "?";
        return `${pad}${k}${opt}: ${toTsType(v, depth + 1)};`;
      }),
      close + "}",
    ];
    return lines.join("\n");
  }

  if (t === "string") {
    if ("const" in schema) return `"${schema.const}"`;
    if (schema.enum) return schema.enum.map((e) => `"${e}"`).join(" | ");
    return "string";
  }

  if (t === "number" || t === "integer") return "number";
  if (t === "boolean") return "boolean";
  if (t === "null") return "null";

  if (Array.isArray(t)) {
    return t.map((tt) => toTsType({ ...schema, type: tt }, depth)).join(" | ");
  }

  return "unknown";
}

function toTypeName(method: string, path: string, status: string): string {
  const pathPart = path.replace(/[^a-zA-Z0-9]/g, "_").replace(/^_+|_+$/g, "");
  return `${method.toUpperCase()}_${pathPart}_${status}`;
}

const lines: string[] = [];

// Named component schema types first (handles recursive refs)
for (const [name, schema] of Object.entries(refs)) {
  lines.push(`export type ${name} = ${toTsType(schema)};`, "");
}

// Response types per path/method/status
for (const [path, methods] of Object.entries(spec.paths ?? {})) {
  for (const [method, op] of Object.entries(methods)) {
    for (const [status, resp] of Object.entries(op.responses ?? {})) {
      const schema = resp.content?.["application/json"]?.schema;
      if (!schema) continue;
      const name = toTypeName(method, path, status);
      lines.push(`export type ${name} = ${toTsType(schema)};`, "");
    }
  }
}

const output = lines.join("\n");
writeFileSync("api-types.ts", output);
console.log(
  `Done. ${lines.filter((l) => l.startsWith("export")).length} types written.`,
);
