import { ai } from "@repo/api/lib/llm-client";
import type { Status, StatusResponse } from "./model";

const CACHE_TIMES = {
  ok: 10 * 60 * 1000,
  error: 30 * 1000,
};

export abstract class StatusService {
  static status: Promise<Status> | null = null;
  static revalidate: { after: Date; timeout: NodeJS.Timeout };

  static async getStatus(): Promise<StatusResponse> {
    let newStatus: Status;

    if (this.status === null) {
      const statusPromise = new Promise<Status>(async (resolve) => {
        try {
          await ai.test();
          resolve("ok");
        } catch (error) {
          resolve("error");
        }
      });

      this.status = statusPromise;
      this.setCacheRevalidation(await statusPromise);
    }

    return {
      status: await this.status,
      revalidateAfter: this.revalidate.after,
    };
  }

  private static setCacheRevalidation(status: keyof typeof CACHE_TIMES) {
    const time = CACHE_TIMES[status];

    clearTimeout(this.revalidate?.timeout);

    this.revalidate = {
      after: new Date(Date.now() + time),
      timeout: setTimeout(() => {
        this.status = null;
      }, time),
    };
  }
}
