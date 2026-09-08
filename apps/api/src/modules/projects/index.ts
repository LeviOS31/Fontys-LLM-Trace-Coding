import { Elysia, t } from "elysia";

import { GenericModel } from "@repo/api/lib/generic";
import { ProjectModel } from "@repo/api/modules/projects/model";
import { ProjectService } from "@repo/api/modules/projects/service";
import { TraceListModel } from "../lists/model";

export default new Elysia({
  prefix: "/projects",
  detail: {
    tags: ["Projects"],
    summary: "Projects module",
    description: "Endpoints for managing projects.",
  },
})
  .get("/", async () => ProjectService.list(), {
    response: {
      200: ProjectModel.ListResponse,
      500: GenericModel.ErrorResponse,
    },
    detail: { summary: "List all projects" },
  })
  .get(
    "/:id/tracelists",
    async ({ params: { id } }) => ProjectService.getProjectTraceLists(id),
    {
      response: {
        200: TraceListModel.ProjectTraceListsResponse,
        500: GenericModel.ErrorResponse,
      },
      detail: { summary: "Get trace lists for a project" },
    },
  )
  .post(
    "/",
    async ({ body, set }) => {
      const result = await ProjectService.create(body);
      set.status = "message" in result ? result.status : 201;
      return result;
    },
    {
      body: ProjectModel.CreateBody,
      response: {
        201: ProjectModel.ProjectSnippet,
        409: GenericModel.ErrorResponse,
        500: GenericModel.ErrorResponse,
      },
      detail: { summary: "Create a project" },
    },
  )
  .get(
    "/:id",
    async ({ params: { id }, set }) => {
      const result = await ProjectService.getProjectById(id);
      if (result && "message" in result) {
        set.status = 404;
        return result;
      }
      return result;
    },
    {
      params: t.Object({ id: t.String({ format: "uuid" }) }),
      response: {
        200: ProjectModel.Project,
        404: GenericModel.ErrorResponse,
      },
      detail: { summary: "Delete a project" },
    },
  )
  .patch(
    "/:id",
    async ({ params: { id }, body, set }) => {
      const result = await ProjectService.update(id, body);
      if ("message" in result) {
        set.status = result.status;
        return result;
      }
      return result;
    },
    {
      params: t.Object({ id: t.String({ format: "uuid" }) }),
      body: ProjectModel.UpdateBody,
      response: {
        200: ProjectModel.ProjectSnippet,
        404: GenericModel.ErrorResponse,
        409: GenericModel.ErrorResponse,
        500: GenericModel.ErrorResponse,
      },
      detail: { summary: "Update a project" },
    },
  )
  .patch(
    "/:id/criteria",
    async ({ params: { id }, body, set }) => {
      const result = await ProjectService.updateCriteria(id, body);

      if ("message" in result) {
        set.status = result.status;
        return result;
      }
    },
    {
      params: t.Object({ id: t.String({ format: "uuid" }) }),
      body: ProjectModel.UpdateCriteriaBody,
      response: {
        200: t.Void(),
        404: GenericModel.ErrorResponse,
        409: GenericModel.ErrorResponse,
        500: GenericModel.ErrorResponse,
      },
      detail: { summary: "Update projectwide assessment criteria." },
    },
  )
  .delete(
    "/:id",
    async ({ params: { id }, set }) => {
      const result = await ProjectService.delete(id);
      if (result && "message" in result) {
        set.status = 500;
        return result;
      }
      set.status = 204;
    },
    {
      params: t.Object({ id: t.String({ format: "uuid" }) }),
      response: {
        204: t.Void(),
        500: GenericModel.ErrorResponse,
      },
      detail: { summary: "Delete a project" },
    },
  );
