import { PartialTrace } from "@/lib/types";
export default function TraceOCLabel({ trace }: { trace: PartialTrace }) {
  if (trace.feedback !== "negative") {
    return;
  }

  if (!trace.hasOpenCode) {
    return <p className="text-red-400 text-xs">No OC</p>;
  }
}
