import { Elysia } from "elysia";

import { GenericModel } from "@repo/api/lib/generic";
import { FilesModel } from "@repo/api/modules/files/model";
import { FilesService } from "@repo/api/modules/files/service";

export default new Elysia({
  prefix: "/files",
  detail: {
    tags: ["Files"],
    summary: "Files module",
    description: "Endpoints for uploading files.",
  },
})
  .post(
    "/",
    async ({ body, set }) => {
      const result = await FilesService.uploadFile(body);
      set.status =
        typeof result == "object" && "status" in result ? result.status : 202;
      return result;
    },
    {
      body: FilesModel.FileUploadBody,
      response: {
        202: FilesModel.FileUploadResponse,
        500: GenericModel.ErrorResponse,
      },
      detail: {
        summary: "Upload file",
        description: "Upload a new file for parsing",
      },
    },
  )
  .post(
    "/probe",
    async ({ body: { buffer }, set }) => {
      const result = await FilesService.probeFile(buffer);
      set.status =
        typeof result == "object" && "status" in result ? result.status : 200;
      return result;
    },
    {
      body: FilesModel.FileProbeBody,
      response: {
        200: FilesModel.FileProbeResponse,
        500: GenericModel.ErrorResponse,
      },
      detail: {
        summary: "Probe file",
        description: "Probe a file to determine file type",
      },
    },
  );
