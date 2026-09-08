import { Trace } from "@/lib/types";

const re = /data:image\/[a-zA-Z0-9+\-]+;base64,[a-zA-Z0-9+/]+=*/gm;

export function extractAttachments(trace: Trace) {
  return {
    system: trace.system?.match(re) as string[],
    input: trace.input.match(re) as string[],
    output: trace.output.match(re) as string[],
    context: trace.context?.match(re) as string[],
  };
}

export function filterAttachments(trace: Trace): Trace {
  return {
    ...trace,
    system: trace.system?.replace(re, "") ?? null,
    input: trace.input.replace(re, ""),
    output: trace.output.replace(re, ""),
    context: trace.context?.replace(re, "") ?? null,
  };
}

export const AttachmentMimes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/avif": "avif",
  "image/bmp": "bmp",
  "image/tiff": "tiff",
  "image/ico": "ico",
  "image/x-icon": "ico",
  "image/heic": "heic",
  "image/heif": "heif",
};
