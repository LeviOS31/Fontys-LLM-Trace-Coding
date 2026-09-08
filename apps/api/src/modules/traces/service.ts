import { prisma } from "@repo/db";
import { GenericModel } from "@repo/api/lib/generic";
import { TracesModel } from "@repo/api/modules/traces/model";
import { ai } from "@repo/api/lib/llm-client";
import z from "zod";

const outputStructure = z.object({
  feedback: z.enum(["positive", "negative"]),
  openCode: z.string(),
});

type Output = z.infer<typeof outputStructure>;

const re = /data:image\/[a-zA-Z0-9+\-]+;base64,[a-zA-Z0-9+/]+=*/gm;

type SmallTrace = {
  id: string;
  system: string | null;
  input: string;
  output: string;
  context: string | null;
};

function filterAttachments(trace: SmallTrace): SmallTrace {
  return {
    ...trace,
    system: trace.system?.replace(re, "") ?? null,
    input: trace.input.replace(re, ""),
    output: trace.output.replace(re, ""),
    context: trace.context?.replace(re, "") ?? null,
  };
}

export abstract class TracesService {
  static savedResponses = new Map<string, Output | Promise<Output>>();
  static aiQueue: Promise<void> = Promise.resolve();
  static activeJobs = 0;

  static async getTraceById(
    id: string,
  ): Promise<TracesModel.TraceResponse | GenericModel.ErrorResponse> {
    async function getTraceRecursive(
      traceId: string,
    ): Promise<TracesModel.Trace | null> {
      const trace = await prisma.trace.findUnique({
        where: { id: traceId },
        select: {
          id: true,
          name: true,
          system: true,
          input: true,
          output: true,
          openCode: true,
          feedback: true,
          isFlagged: true,
          context: true,
          traces: true,
        },
      });

      if (!trace) {
        return null;
      }

      if (trace.traces) {
        const childTraces = (
          await Promise.all(
            trace.traces.map((child) => getTraceRecursive(child.id)),
          )
        ).filter((t): t is TracesModel.Trace => t !== null);

        return { ...trace, traces: childTraces };
      }

      return { ...trace, traces: [] };
    }

    const trace = await getTraceRecursive(id);

    if (!trace) {
      return {
        message: "Trace not found",
        status: 404,
      };
    }

    return trace;
  }

  static async updateTrace({
    traceId,
    feedback,
    openCode,
    isFlagged,
  }: {
    traceId: string;
    feedback: TracesModel.Feedback | null;
    openCode?: string;
    isFlagged: boolean;
  }): Promise<GenericModel.SuccessResponse | GenericModel.ErrorResponse> {
    try {
      await prisma.trace.update({
        where: { id: traceId },
        data: {
          feedback,
          openCode,
          isFlagged,
        },
      });
    } catch {
      return {
        message: "Trace not found",
        status: 404,
      };
    }

    return {
      success: true,
    };
  }

  static async setFlagged({
    traceId,
    isFlagged,
  }: {
    traceId: string;
    isFlagged: boolean;
  }): Promise<true | GenericModel.ErrorResponse> {
    const trace = await prisma.trace.findUnique({
      where: { id: traceId },
    });

    if (!trace) {
      return {
        message: "Trace not found",
        status: 404,
      };
    }

    await prisma.trace.update({
      where: { id: traceId },
      data: {
        isFlagged,
      },
    });

    return true;
  }

  private static async getTrace(id: string) {
    const res = await prisma.trace.findUnique({
      where: { id },
      select: {
        id: true,
        system: true,
        input: true,
        output: true,
        context: true,
        traceList: {
          select: {
            project: {
              select: {
                assessmentCriteria: true,
              },
            },
          },
        },
      },
    });

    if (!res) {
      return null;
    }

    return {
      trace: filterAttachments({
        id: res.id,
        system: res.system,
        input: res.input,
        output: res.output,
        context: res.context,
      }),
      assessmentCriteria: res.traceList.project.assessmentCriteria,
    };
  }

  private static async getAiSuggestion({
    trace,
    assessmentCriteria,
  }: {
    trace: {
      id: string;
      system: string | null;
      input: string;
      output: string;
      context: string | null;
    };
    assessmentCriteria: string;
  }): Promise<Output> {
    const existing = this.savedResponses.get(trace.id);

    if (existing) {
      return existing;
    }

    let release!: () => void;

    const nextJob = new Promise<void>((resolve) => {
      release = resolve;
    });

    const previousJob = this.aiQueue;
    this.aiQueue = previousJob.then(() => nextJob);

    const promise = (async () => {
      await previousJob;

      this.activeJobs++;

      try {
        const systemMessage = await ai.renderPrompt(
          "AI_FEEDBACK_SUGGESTION_SYSTEM",
          { trace: JSON.stringify(trace), assessmentCriteria },
        );
        const userMessage = await ai.renderPrompt(
          "AI_FEEDBACK_SUGGESTION_USER",
          { trace: JSON.stringify(trace), assessmentCriteria },
        );

        const result = await ai.model
          .withStructuredOutput(outputStructure)
          .invoke([
            {
              role: "system",
              content: systemMessage,
            },
            {
              role: "user",
              content: userMessage,
            },
          ]);

        this.savedResponses.set(trace.id, result);

        return result;
      } finally {
        this.activeJobs--;
        release();
      }
    })();

    this.savedResponses.set(trace.id, promise);

    try {
      return await promise;
    } catch (err) {
      this.savedResponses.delete(trace.id);
      throw err;
    }
  }

  static async getSuggestion({
    currentTrace,
    nextTrace,
  }: {
    currentTrace: string;
    nextTrace?: string;
  }): Promise<TracesModel.PostSuggestionResponse | GenericModel.ErrorResponse> {
    const currentTraceRes = await this.getTrace(currentTrace);

    if (!currentTraceRes) {
      return {
        message: "Trace not found",
        status: 404,
      };
    }

    const currentSuggestion = this.getAiSuggestion({
      trace: currentTraceRes.trace,
      assessmentCriteria: currentTraceRes.assessmentCriteria,
    });

    if (nextTrace) {
      const nextTraceRes = await this.getTrace(nextTrace);

      if (nextTraceRes) {
        this.getAiSuggestion({
          trace: nextTraceRes.trace,
          assessmentCriteria: nextTraceRes.assessmentCriteria,
        });
      }
    }

    return await currentSuggestion;
  }
}
