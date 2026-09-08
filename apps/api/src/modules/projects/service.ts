import { prisma } from "@repo/db";
import { GenericModel } from "@repo/api/lib/generic";
import { ProjectModel } from "@repo/api/modules/projects/model";
import { TraceListModel } from "@repo/api/modules/lists/model";
import { NotFoundError } from "elysia";

export abstract class ProjectService {
  static list(): Promise<ProjectModel.ListResponse> {
    return prisma.project.findMany({ orderBy: { createdAt: "desc" } });
  }

  static async getProjectTraceLists(
    projectId: string,
  ): Promise<
    TraceListModel.ProjectTraceListsResponse | GenericModel.ErrorResponse
  > {
    const lists = await prisma.traceList.findMany({
      where: {
        projectId,
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        completedAt: true,
        traces: {
          select: {
            parentId: true,
            feedback: true,
            isFlagged: true
          },
          where: {
            parentId: null
          }
        },
        axialCodes: {
          select: {
            title: true,
            _count: {
              select: {
                connections: true,
              },
            },
          },
        },
        axialCodeFeedback: true
      }
    });

    return lists.map((list) => ({
      id: list.id,
      name: list.name,
      createdAt: list.createdAt,
      completedAt: list.completedAt,
      axialCodeFeedback: list.axialCodeFeedback,
      status: {
        positive: list.traces.filter(
          (t) => t.feedback === "positive" && !t.isFlagged,
        ).length,
        negative: list.traces.filter(
          (t) => t.feedback === "negative" && !t.isFlagged,
        ).length,
        pending: list.traces.filter(
          (t) => t.feedback === null || (t.isFlagged),
        ).length,
      },
      axialCodes: list.axialCodes.map((code) => {
        return {
          name: code.title,
          traceAmount: code._count.connections,
        };
      }),
    }));
  }

  static async create(
    body: ProjectModel.CreateBody,
  ): Promise<ProjectModel.ProjectSnippet | GenericModel.ErrorResponse> {
    const trimmedName = body.name.trim();

    try {
      const existingProject = await prisma.project.findFirst({
        where: {
          name: {
            equals: trimmedName,
            mode: "insensitive",
          },
        },
        select: { id: true },
      });

      if (existingProject) {
        return {
          message: "Project with this name already exists",
          status: 409,
        };
      }

      return await prisma.project.create({
        data: {
          ...body,
          name: trimmedName,
          description: body.description?.trim() ?? "",
          assessmentCriteria: "",
        },
      });
    } catch (e: any) {
      console.error(e);
      return { message: "Failed to create project", status: 500 };
    }
  }

  static async getProjectById(
    id: string,
  ): Promise<ProjectModel.Project | GenericModel.ErrorResponse> {
    try {
      const project = await prisma.project.findUnique({
        where: {
          id,
        },
        include: {
          traceLists: {
            select: {
              id: true,
              files: {
                select: {
                  _count: {
                    select: {
                      traces: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!project) {
        throw new NotFoundError("Project not found");
      }

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        createdAt: project.createdAt,
        assessmentCriteria: project.assessmentCriteria,
      };
    } catch (e) {
      console.error(e);
      return { message: "Failed to fetch the project", status: 500 };
    }
  }

  static async update(
    id: string,
    body: ProjectModel.UpdateBody,
  ): Promise<ProjectModel.ProjectSnippet | GenericModel.ErrorResponse> {
    const trimmedName = body.name.trim();

    try {
      const project = await prisma.project.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!project) {
        return { message: "Project not found", status: 404 };
      }

      const existingProject = await prisma.project.findFirst({
        where: {
          id: { not: id },
          name: {
            equals: trimmedName,
            mode: "insensitive",
          },
        },
        select: { id: true },
      });

      if (existingProject) {
        return {
          message: "Project with this name already exists",
          status: 409,
        };
      }

      return await prisma.project.update({
        where: { id },
        data: {
          name: trimmedName,
          description: body.description?.trim() ?? "",
        },
      });
    } catch (e) {
      console.error(e);
      return { message: "Failed to update project", status: 500 };
    }
  }

  static async updateCriteria(
    id: string,
    body: ProjectModel.UpdateCriteriaBody,
  ): Promise<ProjectModel.ProjectSnippet | GenericModel.ErrorResponse> {
    try {
      const project = await prisma.project.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!project) {
        return { message: "Project not found", status: 404 };
      }

      return await prisma.project.update({
        where: { id },
        data: {
          assessmentCriteria: body.assessmentCriteria.trim(),
        },
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          assessmentCriteria: true,
        },
      });
    } catch (e) {
      console.error(e);
      return {
        message: "Failed to update project assessment criteria.",
        status: 500,
      };
    }
  }

  static async delete(id: string): Promise<void | GenericModel.ErrorResponse> {
    try {
      await prisma.project.delete({ where: { id } });
    } catch (e: any) {
      console.error(e);
      return { message: "Project not found", status: 500 };
    }
  }
}
