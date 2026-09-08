import {
  AxialCodesListSchema,
  AxialCodesModel,
} from "@repo/api/modules/axial/model";
import { ai } from "@repo/api/lib/llm-client";
import { Value } from "@sinclair/typebox/value";
import llmOutputObject = AxialCodesModel.llmOutputObject;
import { prisma } from "@repo/db";
import AxialCodes = AxialCodesModel.AxialCodes;
import { NotFoundError } from "elysia";
import llmInputObject = AxialCodesModel.llmInputObject;
import AxialCodesList = AxialCodesModel.AxialCodesList;
import MinimalOriginalAxialCode = AxialCodesModel.MinimalOriginalAxialCode;
import llmAxialCode = AxialCodesModel.llmAxialCode;
import { JobService } from "@repo/api/modules/jobs/service";
import { JobStatus } from "@repo/api/modules/jobs/model";
import { ListsService } from "@repo/api/modules/lists/service";

export abstract class AxialCodesService {
  static async generateAxialCodes(
    params: AxialCodesModel.generateAxialCodesParams,
  ) {
    const { traceListId, expectedAmount, jobId } = params;

    try {
      const traces = await this.getTracesByTraceListId(traceListId);

      if (traces.length < 1) {
        await JobService.updateStatus(jobId, JobStatus.FAILED);
        throw new Error("Tracelist is empty");
      }

      const openCodes = traces
        .filter((t) => t?.openCode)
        .map((trace) => ({
          openCode: trace.openCode,
          id: trace.id,
        })) as llmInputObject[];

      await this.deleteCurrentAxialCodes(traceListId);

      const response = await this.getLLMResponse(
        openCodes,
        traceListId,
        expectedAmount,
      );

      if (!response) throw new Error("LLM_NO_RESPONSE");

      const validatedData = this.validateResponse(response);

      const job = await JobService.getJob(jobId)
      if (job?.status !== JobStatus.PROCESSING) {
        throw new Error("Job is already processed");
      }

      await this.saveAxialCodes(traceListId, validatedData);

      await JobService.addMetadata(jobId, { response: response });
      await JobService.updateStatus(jobId, JobStatus.COMPLETED);
    } catch (error) {
      console.error(
        `[AxialCodes] generateAxialCodes FAILED — jobId=${jobId}`,
        error,
      );
      await JobService.updateStatus(jobId, JobStatus.FAILED);
    }
  }

  static async getLLMResponse(
    openCodes: llmInputObject[],
    traceListId: string,
    expectedAmount: number,
  ): Promise<AxialCodesList> {
    const structuredLLM = ai.model.withStructuredOutput(AxialCodesListSchema);

    const formattedOpenCodes = JSON.stringify(openCodes, null, 2);

    const systemMessage = await ai.renderPrompt(
      "AXIAL_CODE_GENERATION_SYSTEM",
      {},
    );
    const userMessage = await ai.renderPrompt("AXIAL_CODE_GENERATION_USER", {
      traceListId,
      openCodes: formattedOpenCodes,
      expectedAmount,
    });

    return await structuredLLM.invoke([
      {
        role: "system",
        content: systemMessage,
      },
      {
        role: "user",
        content: userMessage,
      },
    ]);
  }

  static async regenerateAxialCodes(traceListId: string, jobId: string) {
    try {
      const traceList = await ListsService.getTraceList(traceListId);
      const original = await this.getMinimalisticOriginalOutput(traceListId);
      const globalFeedback = traceList.axialCodeFeedback || "";
      await ListsService.updateTracelist(traceList.id, traceList.name, "")
      const response = await this.getLLMRegenerateAxialCodes(
        traceList.id,
        globalFeedback,
        original,
      );

      const job = await JobService.getJob(jobId);

      if (!job) throw new NotFoundError(`Job with id ${jobId} not found`);
      if (job.status !== JobStatus.PROCESSING) {
        throw new Error("Job is already processed");
      }

      job.status = JobStatus.COMPLETED;
      job.metadata = {
        ...job.metadata,
        type: "regenerate",
        traceListId,
        originalOutput: original,
        pendingOutput: response,
        regeneratePrompt: globalFeedback || undefined,
      };

      await JobService.updateJob(job);
    } catch (error) {
      console.error(
        `[AxialCodes] regenerateAxialCodes FAILED — jobId=${jobId}`,
        error,
      );
      await JobService.updateStatus(jobId, "FAILED");
    }
  }

  static async getLLMRegenerateAxialCodes(
    traceListId: string,
    globalFeedback: string,
    originalOutput: MinimalOriginalAxialCode[],
  ): Promise<AxialCodesList> {
    const structuredLLM = ai.model.withStructuredOutput(AxialCodesListSchema);

    const formattedCodes = originalOutput
      .map(
        (code) => `
    * Code Title: ${code.title}
      Current Description: ${code.description}
      Connected Traces: ${code.connections.map((c) => JSON.stringify(c.trace)).join(", ")}
      Status: ${code.feedback?.trim() ? `CHANGE REQUESTED: "${code.feedback}"` : "NO CHANGES REQUESTED"}
      `,
      )
      .join("\n");

    const systemPrompt = await ai.renderPrompt(
      "AXIAL_CODE_REGENERATION_SYSTEM",
      { traceListId },
    );
    const userPrompt = await ai.renderPrompt("AXIAL_CODE_REGENERATION_USER", {
      globalFeedback: globalFeedback ?? "No global feedback given",
      formattedCodes,
    });

    return await structuredLLM.invoke([
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ]);
  }

  static async replaceAxialCodes(
    traceListId: string,
    axialCodes: llmAxialCode[],
  ) {
    await prisma.axialCode.deleteMany({
      where: {
        traceListId: traceListId,
      },
    });

    await this.saveAxialCodes(traceListId, axialCodes);
  }

  static async deleteCurrentAxialCodes(traceListId: string) {
    await prisma.axialCode.deleteMany({
      where: {
        traceListId: traceListId,
      },
    });
  }
  static async saveAxialCodes(
    traceListId: string,
    axialCodes: AxialCodesModel.llmAxialCode[],
  ) {
    const createOps = axialCodes
      .filter((code) =>
        code.connections.every((connection) =>
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            connection.traceId,
          ),
        ),
      )
      .map((code) =>
        prisma.axialCode.create({
          data: {
            title: code.title,
            description: code.description,
            traceListId,
            reason: code.reason,
            connections: {
              create: code.connections.map((conn) => ({
                reason: conn.reason,
                trace: {
                  connect: { id: conn.traceId },
                },
              })),
            },
          },
          include: {
            connections: {
              include: {
                trace: true,
              },
            },
          },
        }),
      );

    return prisma.$transaction(createOps);
  }
  static validateResponse(response: AxialCodesList): llmOutputObject {
    if (!response) throw new Error("Response is null");

    if (!Value.Check(AxialCodesModel.llmOutputObject, response)) {
      throw new Error(
        "LLM response validation failed: " +
          Value.Errors(AxialCodesModel.llmOutputObject, response),
      );
    }

    return Value.Cast(AxialCodesModel.llmOutputObject, response);
  }
  static async getTracesByTraceListId(traceListId: string) {
    return prisma.trace.findMany({
      where: {
        file: {
          traceListId,
        },
        openCode: {
          not: null,
        },
      },
    });
  }
  static async getAxialCodesByTraceListId(traceListId: string) {
    return prisma.axialCode.findMany({
      where: {
        traceListId,
      },
      include: {
        connections: {
          include: {
            trace: true,
          },
        },
      },
    });
  }
  static async traceListExistsById(traceListId: string) {
    return prisma.traceList.findUnique({
      where: {
        id: traceListId,
      },
    });
  }
  static async getValidatedAxialCodesByTraceListId(
    traceListId: string,
  ): Promise<AxialCodes> {
    const traceListExists = await this.traceListExistsById(traceListId);

    if (!traceListExists) throw new NotFoundError("Trace list not found.");

    const rawAxialCodes = await this.getAxialCodesByTraceListId(traceListId);

    return Value.Cast(AxialCodes, rawAxialCodes);
  }

  static async getTraceListStatistics(
    traceListId: string,
  ): Promise<AxialCodesModel.StatisticsResponse> {
    const [axialCodes, totalTraces] = await prisma.$transaction([
      prisma.axialCode.findMany({
        where: { traceListId },
        select: {
          id: true,
          title: true,
          _count: {
            select: { connections: true },
          },
        },
      }),
      prisma.traceConnection.count({
        where: {
          AND: [{ axialCode: { traceListId } }, { trace: { traceListId } }],
        },
      }),
    ]);

    const codedCodes = axialCodes.filter((code) => code._count.connections > 0);
    const sortedByFrequency = codedCodes.sort(
      (a, b) => a._count.connections - b._count.connections,
    );

    const leastActual = sortedByFrequency[0] || {
      title: "N/A",
      _count: { traces: 0 },
    };
    const mostActual = sortedByFrequency[sortedByFrequency.length - 1] || {
      title: "N/A",
      _count: { traces: 0 },
    };

    const uniqueCodesCount = codedCodes.length;
    const avgTracesPerCode =
      uniqueCodesCount > 0
        ? parseFloat((totalTraces / uniqueCodesCount).toFixed(1))
        : 0;

    const calcPct = (part: number, total: number) =>
      total > 0 ? `${((part / total) * 100).toFixed(1)}%` : "0%";

    return {
      mostActual: {
        title: mostActual.title,
        count: mostActual._count.connections,
        percentage: calcPct(mostActual._count.connections, totalTraces),
      },
      leastActual: {
        title: leastActual.title,
        count: leastActual._count.connections,
        percentage: calcPct(leastActual._count.connections, totalTraces),
      },
      schemaStats: {
        uniqueCodes: uniqueCodesCount,
        avgTracesPerCode,
      },
    };
  }

  static async updateAxialCodeById({
    axialCodeId,
    title,
    description,
    feedback,
  }: {
    axialCodeId: string;
    title: string;
    description: string;
    feedback: string;
  }): Promise<boolean> {
    const existingCode = await prisma.axialCode.findUnique({
      where: { id: axialCodeId },
    });

    if (!existingCode) {
      throw new NotFoundError("Axial code not found.");
    }

    return Boolean(
      await prisma.axialCode.update({
        where: { id: axialCodeId },
        data: {
          title,
          description,
          feedback,
        },
      }),
    );
  }

  static async getMinimalisticOriginalOutput(traceListId: string) {
    return prisma.axialCode.findMany({
      where: {
        traceListId: traceListId,
      },
      select: {
        title: true,
        description: true,
        reason: true,
        feedback: true,
        connections: {
          select: {
            reason: true,
            trace: {
              select: {
                id: true,
                openCode: true,
              },
            },
          },
        },
      },
    });
  }
}
