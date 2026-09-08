import { t } from "elysia";

export namespace ProjectModel {
  export const CreateBody = t.Object({
    name: t.String({ minLength: 1 }),
    description: t.Optional(t.String()),
  });

  export const UpdateBody = t.Object({
    name: t.String({ minLength: 1 }),
    description: t.Optional(t.String()),
  });

  export const UpdateCriteriaBody = t.Object({
    assessmentCriteria: t.String(),
  });

  export const ProjectSnippet = t.Object({
    id: t.String({ format: "uuid" }),
    name: t.String(),
    description: t.String(),
    createdAt: t.Date(),
  });

  export const Project = t.Object({
    id: t.String({ format: "uuid" }),
    name: t.String(),
    description: t.String(),
    assessmentCriteria: t.String(),
    createdAt: t.Date(),
  });

  export const ListResponse = t.Array(ProjectSnippet);

  export type CreateBody = typeof CreateBody.static;
  export type UpdateBody = typeof UpdateBody.static;
  export type UpdateCriteriaBody = typeof UpdateCriteriaBody.static;
  export type ProjectSnippet = typeof ProjectSnippet.static;
  export type Project = typeof Project.static;
  export type ListResponse = typeof ListResponse.static;
}
