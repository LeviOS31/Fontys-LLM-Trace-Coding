import { Value } from "@sinclair/typebox/value";

import { prisma } from "@repo/db";
import { GenericModel } from "@repo/api/lib/generic";
import { TracesModel } from "@repo/api/modules/traces/model";
import { TraceListModel } from "@repo/api/modules/lists/model";
import { NotFoundError } from "elysia";

export abstract class ListsService {
  static async getList(
    traceListId: string,
  ): Promise<TracesModel.TracesResponse | GenericModel.ErrorResponse> {
    const traces = await prisma.trace.findMany({
      where: {
        file: {
          traceListId,
        },
        parentId: null,
      },
      select: {
        id: true,
        name: true,
        feedback: true,
        isFlagged: true,
        openCode: true,
        input: true,
      },
    });

    return traces.map((trace) => ({
      id: trace.id,
      name: trace.name,
      feedback: trace.feedback,
      isFlagged: trace.isFlagged,
      hasOpenCode: trace.openCode != null && trace.openCode.length > 0,
      input_preview: trace.input?.slice(0, 50),
    }));
  }

  static async deleteTracelist(
    traceListId: string,
  ): Promise<void | GenericModel.ErrorResponse> {
    const result = await prisma.traceList.delete({
      where: {
        id: traceListId,
      },
      select: {
        id: true,
      },
    });

    if (!result) {
      return {
        status: 404,
        message: "Tracelist not found.",
      };
    }
  }

  static async updateTracelist(
    traceListId: string,
    newName: string,
    axialCodeFeedback: string,
  ): Promise<void | GenericModel.ErrorResponse> {
    const result = await prisma.traceList.update({
      where: {
        id: traceListId,
      },
      data: {
        name: newName,
        axialCodeFeedback: axialCodeFeedback,
      },
      select: {
        id: true,
      },
    });

    if (!result) {
      return {
        status: 404,
        message: "Tracelist not found.",
      };
    }
  }

  static async getTraceList(
    traceListId: string,
  ): Promise<TraceListModel.TraceListResponse> {
    const list = await prisma.traceList.findFirst({
      where: {
        id: traceListId,
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        completedAt: true,
        traces: true,
        axialCodeFeedback: true,
      },
    });

    if (!list) {
      throw new NotFoundError("Tracelist not found.");
    }

    return {
      id: list.id,
      name: list.name,
      createdAt: list.createdAt,
      completedAt: list.completedAt,
      axialCodeFeedback: list.axialCodeFeedback,
      status: {
        positive: list.traces.filter(
          (t) =>
            t.parentId == null && t.feedback === "positive" && !t.isFlagged,
        ).length,
        negative: list.traces.filter(
          (t) =>
            t.parentId == null && t.feedback === "negative" && !t.isFlagged,
        ).length,
        pending: list.traces.filter(
          (t) => t.parentId == null && (t.feedback === null || t.isFlagged),
        ).length,
      },
      axialCodes: [],
    };
  }

  static async exportTraceList(
    traceListId: string,
  ): Promise<
    TraceListModel.TraceListExportResponse | GenericModel.ErrorResponse
  > {
    try {
      const data = await prisma.traceList.findUnique({
        where: {
          id: traceListId,
        },
        select: {
          name: true,
          createdAt: true,
          traces: {
            select: {
              id: true,
              parentId: true,
              name: true,
              system: true,
              input: true,
              output: true,
              openCode: true,
              context: true,
              feedback: true,
              isFlagged: true,
            },
          },
          axialCodes: {
            select: {
              title: true,
              description: true,
              reason: true,
              connections: {
                select: {
                  traceId: true,
                  reason: true,
                },
              },
            },
          },
        },
      });

      if (!data) {
        return {
          message: "Tracelist not found.",
          status: 404,
        };
      }

      return {
        ...data,
        axialCodes: data.axialCodes.map((code) => ({
          ...code,
          traces: code.connections,
        })),
      };
    } catch (e: any) {
      console.error(e);
      return {
        status: 500,
        message: e.message ?? "An unexpected error occurred",
      };
    }
  }

  static async importTraceList(
    body: TraceListModel.TraceListImportBody,
  ): Promise<TraceListModel.TraceListImportResponse> {
    try {
      const rawData = await body.export.json();
      if (!rawData) {
        return { success: false, id: null };
      }

      const data = Value.Parse(TraceListModel.TraceListExportResponse, rawData);

      const traceIdSet = new Set(data.traces.map((t) => t.id));
      for (const code of data.axialCodes) {
        const missingRefs = code.traces.filter(
          (connection) => !traceIdSet.has(connection.traceId),
        );
        if (missingRefs.length > 0) {
          console.warn(
            `Axial code "${code.title}" references unknown trace IDs:`,
            missingRefs,
          );
          return { success: false, id: null };
        }
      }

      const result = await prisma.$transaction(async (tx) => {
        const traceList = await tx.traceList.create({
          data: {
            name: data.name,
            createdAt: data.createdAt,
            projectId: body.projectId,
            files: {
              create: {
                name: `${data.name} (Imported at ${Date.now()})`,
                size: 0,
              },
            },
          },
          select: {
            id: true,
            files: { select: { id: true } },
          },
        });

        const traceIdMap = new Map<string, string>();
        const tracesToParent = [];
        for (const trace of data.traces) {
          const createdTrace = await tx.trace.create({
            data: {
              name: trace.name,
              system: trace.system,
              input: trace.input,
              output: trace.output,
              openCode: trace.openCode,
              context: trace.context,
              feedback: trace.feedback,
              isFlagged: trace.isFlagged,
              traceListId: traceList.id,
              fileId: traceList.files[0].id,
            },
            select: { id: true },
          });
          traceIdMap.set(trace.id, createdTrace.id);
          tracesToParent.push({
            newDbId: createdTrace.id,
            originalParentId: trace.parentId,
          });
        }

        for (const { newDbId, originalParentId } of tracesToParent) {
          if (originalParentId) {
            const mappedParentId = traceIdMap.get(originalParentId);
            if (!mappedParentId) {
              throw new Error(
                `Orphaned trace: ${originalParentId} not found for import mapping. Check your parent references.`,
              );
            }
            await tx.trace.update({
              where: { id: newDbId },
              data: { parentId: mappedParentId },
            });
          }
        }

        for (const code of data.axialCodes) {
          await tx.axialCode.create({
            data: {
              title: code.title,
              description: code.description,
              reason: code.reason,
              traceListId: traceList.id,
              connections: {
                create: code.traces.map((connection) => {
                  const newTraceId = traceIdMap.get(connection.traceId);
                  if (!newTraceId) {
                    throw new Error(
                      `Orphaned trace: ${connection.traceId} not found in import mapping for axial code "${code.title}"`,
                    );
                  }
                  return {
                    traceId: newTraceId,
                    reason: code.reason,
                  };
                }),
              },
            },
          });
        }

        return traceList;
      });

      return { success: true, id: result.id };
    } catch (e) {
      console.error(e);
      return {
        success: false,
        id: null,
      };
    }
  }
}
