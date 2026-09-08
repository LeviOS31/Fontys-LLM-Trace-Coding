import { prisma } from "@repo/db";
import { GenericModel } from "@repo/api/lib/generic";
import { FilesModel } from "@repo/api/modules/files/model";
import init, { parse, FileType, probe } from "@repo/parser";

export abstract class FilesService {
  static async uploadFile(
    body: FilesModel.FileUploadBody,
  ): Promise<FilesModel.FileUploadResponse | GenericModel.ErrorResponse> {
    try {
      const { type, file, projectId } = body;

      if (!projectId) throw new Error("projectId is required");
      if (!Object.keys(FileType).includes(type))
        throw new Error("Parser type not supported");

      await init();

      const content = await file.text();
      const parseResult: FilesModel.Trace[] = await parse(
        FileType[type as keyof typeof FileType],
        content,
      );

      if (!parseResult) throw new Error("Failed to parse file");

      const savedFile = await prisma.file.create({
        data: {
          name: file.name,
          size: file.size,
          traceList: {
            create: {
              projectId,
            },
          },
        },
        select: {
          id: true,
          traceListId: true,
        },
      });

      if (!savedFile) throw new Error("Failed to save file metadata");

      for (const trace of parseResult) {
        await this.saveTrace(
          savedFile.id,
          trace,
          undefined,
          savedFile.traceListId,
        );
      }

      return {
        traceListId: savedFile.traceListId,
        traces: parseResult.length,
      };
    } catch (e: any) {
      console.error(e);
      return {
        status: 500,
        message: e.message,
      };
    }
  }

  static async saveTrace(
    fileId: string,
    trace: FilesModel.Trace,
    parentId: string | undefined = undefined,
    traceListId: string,
  ) {
    const traceId = await prisma.trace.create({
      data: {
        name: trace.name,
        system: trace.system,
        input: trace.input,
        output: trace.output,
        context: trace.context,
        openCode: trace.openCode,
        traceListId,
        fileId,
        parentId,
      },
      select: {
        id: true,
      },
    });

    for (const child of trace.children) {
      await this.saveTrace(fileId, child, traceId.id, traceListId);
    }
  }

  static async probeFile(
    buffer: number[],
  ): Promise<FilesModel.FileProbeResponse | GenericModel.ErrorResponse> {
    try {
      const buf = Uint8Array.from(buffer);
      const text = new TextDecoder("utf-8", { fatal: false }).decode(buf);

      if (!FilesService.isLikelyText(buf))
        return { kind: "binary", sample: text, incompleteParse: false };

      await init();

      const probeResult = await probe(text);

      return FilesService.mapToObject(
        probeResult,
      ) as FilesModel.FileProbeResponse;
    } catch (e: any) {
      console.error(e);
      return {
        status: 500,
        message: e.message,
      };
    }
  }

  private static isLikelyText(buf: Uint8Array) {
    for (let i = 0; i < buf.length; i++) {
      if (buf[i] === 0) return false;
    }

    return true;
  }

  private static mapToObject(value: unknown): unknown {
    if (value instanceof Map) {
      const obj: Record<string, unknown> = {};

      for (const [k, v] of value) {
        obj[String(k)] = FilesService.mapToObject(v);
      }

      return obj;
    }

    if (Array.isArray(value)) {
      return value.map(FilesService.mapToObject);
    }

    return value;
  }
}
