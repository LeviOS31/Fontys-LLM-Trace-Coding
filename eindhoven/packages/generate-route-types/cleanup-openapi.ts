import fs from "fs";

const spec = JSON.parse(fs.readFileSync("openapi.json", "utf-8"));

const collected: Record<string, unknown> = {};

// First pass: collect all schemas with $id
function collect(obj: unknown): void {
  if (Array.isArray(obj)) {
    obj.forEach(collect);
    return;
  }
  if (obj && typeof obj === "object") {
    const o = obj as Record<string, unknown>;
    if (typeof o.$id === "string") {
      const { $id, ...schema } = o;
      collected[$id] = schema;
    }
    Object.values(o).forEach(collect);
  }
}

// Second pass: strip $id, rewrite bare $refs
function rewrite(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(rewrite);
  if (obj && typeof obj === "object") {
    const o = obj as Record<string, unknown>;
    // Rewrite bare $ref (no # prefix)
    if (typeof o.$ref === "string" && !o.$ref.startsWith("#")) {
      return { $ref: `#/components/schemas/${o.$ref}` };
    }
    const { $id, ...rest } = o;
    return Object.fromEntries(
      Object.entries(rest).map(([k, v]) => [k, rewrite(v)]),
    );
  }
  return obj;
}

collect(spec);
const rewritten = rewrite(spec) as Record<string, unknown>;

// Hoist into components/schemas
rewritten.components = {
  ...((rewritten.components as Record<string, unknown>) ?? {}),
  schemas: {
    ...(((rewritten.components as Record<string, unknown>)
      ?.schemas as object) ?? {}),
    ...Object.fromEntries(
      Object.entries(collected).map(([k, v]) => [k, rewrite(v)]),
    ),
  },
};

fs.writeFileSync("openapi.clean.json", JSON.stringify(rewritten, null, 2));
