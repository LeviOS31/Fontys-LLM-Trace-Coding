import { beforeEach, describe, expect, mock, test } from "bun:test";
import { prisma } from "@repo/db";
import { AxialCodesService } from "@repo/api/modules/axial/service";
import { JobService } from "@repo/api/modules/jobs/service";
import { JobStatus } from "@repo/api/modules/jobs/model";
import jobs from "@repo/api/modules/jobs";
import { ListsService } from "@repo/api/modules/lists/service";

const invokeMock = mock();

mock.module("@repo/db", () => ({
  prisma: {
    trace: { findMany: mock() },
    axialCode: { create: mock(), findMany: mock(), deleteMany: mock() },
    traceList: {
      findUnique: mock(),
      findFirst: mock().mockResolvedValue({
        id: "550e8400-e29b-41d4-a716-446655440003",
      }),
    },
    $transaction: mock(async (promises) => await Promise.all(promises)),
  },
}));

mock.module("@repo/api/lib/llm-client", () => ({
  ai: {
    renderPrompt: mock(async () => "System message content"),
    model: {
      withStructuredOutput: mock(() => ({
        invoke: invokeMock,
      })),
    },
  },
}));

mock.module("@repo/api/modules/jobs/service", () => ({
  JobService: {
    updateStatus: mock(),
    getJob: mock(),
    updateJob: mock(),
    deleteJob: mock(),
    addMetadata: mock(),
  },
}));

mock.module("@repo/api/modules/lists/service", () => ({
  ListsService: {
    getTraceList: mock(async () => ({
      id: "550e8400-e29b-41d4-a716-446655440003",
      name: "Test List",
      traces: [],
      axialCodeFeedback: "",
    })),
    updateTracelist: mock(async () => ({}))
  },
}));

describe("axialCodeService", () => {
  const mockJobId = "550e8400-e29b-41d4-a716-446655440001";
  const mockTraceId = "550e8400-e29b-41d4-a716-446655440002";
  const mockTraceListId = "550e8400-e29b-41d4-a716-446655440003";

  beforeEach(() => {
    mock.restore();
    invokeMock.mockClear();
    (JobService.updateStatus as any).mockClear();
    (JobService.updateJob as any).mockClear();
    (JobService.deleteJob as any).mockClear();
    (JobService.addMetadata as any).mockClear();
    (JobService.getJob as any).mockClear();
    (prisma.axialCode.deleteMany as any).mockClear();
    (prisma.axialCode.create as any).mockClear();
    (prisma.axialCode.create as any).mockImplementation(async () => ({
      id: "new_id",
    }));
  });

  describe("generateAxialCodes", () => {
    test("Happy flow generate axial codes", async () => {
      (prisma.trace.findMany as any).mockResolvedValue([
        { id: mockTraceId, openCode: "OC" },
      ]);


      (JobService.getJob as any).mockImplementation(async () => ({
        id: mockJobId,
        status: "PROCESSING",
        metadata: {},
      }));

      const mockLlmResponse = [
        {
          title: "Bereikbaarheid",
          description: "D",
          reason: "R",
          traceListId: mockTraceListId,
          connections: [{ traceId: mockTraceId, reason: "R" }],
        },
      ];

      invokeMock.mockResolvedValue(mockLlmResponse);
      (prisma.axialCode.create as any).mockResolvedValue({ id: "new_id" });

      await AxialCodesService.generateAxialCodes({
        traceListId: mockTraceListId,
        expectedAmount: 1,
        jobId: mockJobId,
      });

      expect(JobService.updateStatus).toHaveBeenCalledWith(
        mockJobId,
        JobStatus.COMPLETED,
      );
      expect(prisma.axialCode.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: "Bereikbaarheid",
            traceListId: mockTraceListId,
          }),
        }),
      );
    });

    test("Set prompt to FAILED if tracelist is empty", async () => {
      (prisma.trace.findMany as any).mockResolvedValue([]);

      await AxialCodesService.generateAxialCodes({
        traceListId: mockTraceListId,
        expectedAmount: 1,
        jobId: mockJobId,
      });

      expect(JobService.updateStatus).toHaveBeenCalledWith(
        mockJobId,
        JobStatus.FAILED,
      );
      expect(invokeMock).not.toHaveBeenCalled();
    });

    test("Set prompt to FAILED if LLM does not return a response", async () => {
      (prisma.trace.findMany as any).mockResolvedValue([
        { id: "1", openCode: "OC" },
      ]);
      invokeMock.mockResolvedValue(null);

      await AxialCodesService.generateAxialCodes({
        traceListId: mockTraceListId,
        expectedAmount: 1,
        jobId: mockJobId,
      });

      expect(JobService.updateStatus).toHaveBeenCalledWith(
        mockJobId,
        JobStatus.FAILED,
      );
    });

    test("Set prompt to FAILED if database save fails", async () => {
      (prisma.trace.findMany as any).mockResolvedValue([
        { id: mockTraceId, openCode: "OC" },
      ]);

      invokeMock.mockResolvedValue([
        {
          title: "T",
          description: "D",
          reason: "R",
          traceListId: mockTraceListId,
          connections: [{ traceId: mockTraceId, reason: "R" }],
        },
      ]);

      (prisma.axialCode.create as any).mockImplementation(() => {
        throw new Error("DB_CRASH");
      });

      await AxialCodesService.generateAxialCodes({
        traceListId: mockTraceListId,
        expectedAmount: 1,
        jobId: mockJobId,
      });

      expect(JobService.updateStatus).toHaveBeenCalledWith(
        mockJobId,
        JobStatus.FAILED,
      );
    });
  });

  describe("regenerateAxialCodes", () => {
    const mockNewLlmResponse = [
      {
        title: "Nieuwe Titel",
        description: "D",
        reason: "R",
        traceListId: mockTraceListId,
        connections: [{ traceId: mockTraceId, reason: "R" }],
      },
    ];

    test("Happy flow: stores pendingOutput in prompt metadata without replacing existing codes", async () => {
      (prisma.axialCode.findMany as any).mockResolvedValue([]);

      invokeMock.mockResolvedValue(mockNewLlmResponse);

      (JobService.getJob as any).mockResolvedValue({
        id: mockJobId,
        status: JobStatus.PROCESSING,
        metadata: {},
      });

      await AxialCodesService.regenerateAxialCodes(mockTraceListId, mockJobId);

      expect(prisma.axialCode.deleteMany).not.toHaveBeenCalled();
      expect(JobService.updateJob).toHaveBeenCalledWith(
        expect.objectContaining({
          status: JobStatus.COMPLETED,
          metadata: expect.objectContaining({
            type: "regenerate",
            pendingOutput: mockNewLlmResponse,
          }),
        }),
      );
    });

    test("Set prompt to FAILED if the prompt is not found", async () => {
      (prisma.axialCode.findMany as any).mockResolvedValue([]);

      invokeMock.mockResolvedValue([]);

      (JobService.getJob as any).mockResolvedValue(null);

      await AxialCodesService.regenerateAxialCodes(
        mockTraceListId,
        "non-existent-id",
      );

      expect(JobService.updateStatus).toHaveBeenCalledWith(
        "non-existent-id",
        "FAILED",
      );
      expect(prisma.axialCode.deleteMany).not.toHaveBeenCalled();
    });
  });

  describe("replaceAxialCodes (accept flow)", () => {
    test("Deletes old axial codes and saves the new ones", async () => {
      const newCodes = [
        {
          title: "Geaccepteerde Titel",
          description: "D",
          reason: "R",
          traceListId: mockTraceListId,
          connections: [{ traceId: mockTraceId, reason: "R" }],
        },
      ];

      (prisma.axialCode.deleteMany as any).mockResolvedValue({});

      await AxialCodesService.replaceAxialCodes(
        mockTraceListId,
        newCodes as any,
      );

      expect(prisma.axialCode.deleteMany).toHaveBeenCalledWith({
        where: { traceListId: mockTraceListId },
      });
      expect(prisma.axialCode.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: "Geaccepteerde Titel",
            traceListId: mockTraceListId,
          }),
        }),
      );
    });
  });

  describe("reject flow", () => {
    test("Cancelling does not modify any axial codes", async () => {
      await AxialCodesService.replaceAxialCodes(mockTraceListId, []);

      expect(prisma.axialCode.deleteMany).toHaveBeenCalledWith({
        where: { traceListId: mockTraceListId },
      });
      expect(prisma.axialCode.create).not.toHaveBeenCalled();
    });
  });

  describe("Save invalid axial codes filter", () => {
    test("Filter codes with invalid UUID's", async () => {
      const badResponse = [
        {
          title: "Title",
          connections: [{ traceId: "invalid-uuid", reason: "R" }],
        },
      ];

      await AxialCodesService.saveAxialCodes(
        mockTraceListId,
        badResponse as any,
      );

      expect(prisma.axialCode.create).not.toHaveBeenCalled();
    });
  });

  describe("Service Edge Cases", () => {
    const mockTraceId = "550e8400-e29b-41d4-a716-446655440002";
    const mockTraceListId = "550e8400-e29b-41d4-a716-446655440003";

    test("saveAxialCodes: moet valide codes opslaan en invalide codes filteren binnen één batch", async () => {
      const mixedResponse = [
        {
          title: "Valide Code",
          connections: [{ traceId: mockTraceId, reason: "R" }],
        },
        {
          title: "Invalide Code",
          connections: [{ traceId: "not-a-uuid", reason: "R" }],
        },
      ];

      await AxialCodesService.saveAxialCodes(
        mockTraceListId,
        mixedResponse as any,
      );

      expect(prisma.axialCode.create).toHaveBeenCalledTimes(1);
      expect(prisma.axialCode.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ title: "Valide Code" }),
        }),
      );
    });

    test("getValidatedAxialCodesByTraceListId: moet de juiste data casten", async () => {
      (prisma.traceList.findUnique as any).mockResolvedValue({
        id: mockTraceListId,
      });
      (prisma.axialCode.findMany as any).mockResolvedValue([
        {
          id: "1",
          title: "Test",
          description: "D",
          connections: [{ reason: "R", trace: { id: "T1", openCode: "OC" } }],
        },
      ]);

      const result =
        await AxialCodesService.getValidatedAxialCodesByTraceListId(
          mockTraceListId,
        );

      expect(result[0]).toHaveProperty("title", "Test");
      expect(result[0].connections[0].trace).toHaveProperty("openCode", "OC");
    });
  });
});
