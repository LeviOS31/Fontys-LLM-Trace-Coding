import { prisma } from "@repo/db";
import { JobModel } from "@repo/api/modules/jobs/model";
import Job = JobModel.Job;
import { NotFoundError } from "elysia";

export abstract class JobService {
  static async createJob(metadata?: Record<string, any>): Promise<Job | null> {
    return prisma.job.create({
      data: {
        metadata: metadata ?? {},
      },
    }) as unknown as Job;
  }

  static async getJob(jobId: string): Promise<Job | null> {
    const job = await prisma.job.findUnique({
      where: {
        id: jobId,
      },
    });

    return job as unknown as Job;
  }

  static async getAll(): Promise<Job[] | null> {
    return prisma.job.findMany() as unknown as Job[];
  }

  static async updateStatus(
    jobId: string,
    status: "FAILED" | "COMPLETED" | "PROCESSING",
  ): Promise<Job | null> {
    return prisma.job.update({
      where: {
        id: jobId,
      },
      data: {
        status: status,
      },
    }) as unknown as Job;
  }

  static async updateJob(job: Job): Promise<Job | null> {
    return prisma.job.update({
      where: {
        id: job.id,
      },
      data: {
        status: job.status,
        error: job.error,
        metadata: job.metadata,
      },
    }) as unknown as Job;
  }

  static async deleteJob(jobId: string): Promise<void> {
    await prisma.job.delete({ where: { id: jobId } });
  }

  static async addMetadata(
    jobId: string,
    metadata: Record<string, any>,
  ): Promise<Job | null> {
    const currentJob = await prisma.job.findUnique({
      where: { id: jobId },
      select: { metadata: true },
    });

    if (!currentJob) throw new NotFoundError();

    const existingMetadata =
      currentJob.metadata &&
      typeof currentJob.metadata === "object" &&
      !Array.isArray(currentJob.metadata)
        ? (currentJob.metadata as Record<string, any>)
        : {};

    return prisma.job.update({
      where: {
        id: jobId,
      },
      data: {
        metadata: {
          ...existingMetadata,
          ...metadata,
        },
      },
    }) as unknown as Job;
  }

  static async cancelJob(jobId: string): Promise<Job | null> {
    const currentJob = await prisma.job.findUnique({
      where: { id: jobId },
    })

    if (!currentJob) throw new NotFoundError();

    await this.updateStatus(jobId, "FAILED");
    return await this.addMetadata(jobId, {reason: "Canceled"});
  }

  static async cleanupStalledJobs() {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const stalledJobs = await prisma.job.updateMany({
      where: {
        status: "PROCESSING",
        updatedAt: {
          lt: tenMinutesAgo,
        },
      },
      data: {
        status: "FAILED",
        error: "Timeout error: Job stalled for more than 10 minutes",
      },
    });

    return stalledJobs.count;
  }
}
