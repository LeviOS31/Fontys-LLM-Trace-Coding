import { t } from "elysia";

export namespace FilesModel {
  export const FileUploadBody = t.Object({
    file: t.File(),
    type: t.String(),
    projectId: t.String(),
  });

  export const Trace = t.Recursive((This) =>
    t.Object({
      name: t.Optional(t.Nullable(t.String())),
      system: t.Optional(t.Nullable(t.String())),
      input: t.String(),
      output: t.String(),
      openCode: t.Optional(t.Nullable(t.String())),
      context: t.Optional(t.Nullable(t.String())),
      children: t.Array(This),
    }),
  );

  export const FileUploadResponse = t.Object({
    traceListId: t.String(),
    traces: t.Number(),
  });

  export type FileUploadBody = typeof FileUploadBody.static;
  export type Trace = typeof Trace.static;
  export type FileUploadResponse = typeof FileUploadResponse.static;

  export const FileProbeBody = t.Object({
    buffer: t.Array(t.Number()),
  });

  export const FileProbeResponse = t.Object({
    kind: t.UnionEnum(["csv", "json", "binary"]),
    sample: t.Any(),
    incompleteParse: t.Optional(t.Boolean()),
    opentelemetry: t.Optional(t.Boolean()),
    jsonStructure: t.Optional(t.UnionEnum(["array", "object", "primitive"])),
    delimiter: t.Optional(t.String()),
    columns: t.Optional(t.Number()),
    hasHeader: t.Optional(t.Boolean()),
    headers: t.Optional(t.Array(t.String())),
  });

  export type FileProbeBody = typeof FileProbeBody.static;
  export type FileProbeResponse = typeof FileProbeResponse.static;
}
