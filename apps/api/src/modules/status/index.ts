import { Elysia } from "elysia";

import { StatusResponse } from "./model";
import { StatusService } from "./service";

export default new Elysia({
  prefix: "/status",
  detail: {
    tags: ["Axial Codes"],
    summary: "Axial Codes module",
    description: "Endpoints for managing axial codes.",
  },
}).get(
  "/ai",
  async function () {
    return await StatusService.getStatus();
  },
  {
    response: {
      200: StatusResponse,
    },
    detail: {
      summary: "Get AI status",
      description: "Get the status of the LLM service.",
    },
  },
);
