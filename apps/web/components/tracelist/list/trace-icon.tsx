import { CheckIcon, Flag, LucideProps, XIcon } from "lucide-react";
import { PartialTrace } from "@/lib/types";

export default function TraceIcon({
  trace,
  ...props
}: { trace: PartialTrace } & LucideProps) {
  if (trace.isFlagged) {
    return <Flag {...props} />;
  }

  switch (trace.feedback) {
    case "positive":
      return <CheckIcon {...props} />;
    case "negative":
      return <XIcon {...props} />;
  }

  return <></>;
}
