export interface OpenCode {
  traceId: string;
  openCode: string | null;
  hasAxialCode: boolean;
}

export interface OpenCodeByVersion {
  openCodeId: string;
  openCode: string | null;
}
