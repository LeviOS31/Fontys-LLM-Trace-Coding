"use client";

import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { TriangleAlertIcon } from "lucide-react";

export default function ErrorMessage({ messages }: { messages: string[] }) {
  return (
    <Alert variant={"destructive"}>
      <AlertTitle className="flex flex-row gap-2 items-center">
        <TriangleAlertIcon size={20} />
        An error has occured.
      </AlertTitle>
      <AlertDescription>
        Due to an error, this page could not be loaded correctly.
        <p className="text-neutral-700 text-xs">
          Reason(s): {messages.join(", ")}
        </p>
      </AlertDescription>
    </Alert>
  );
}
