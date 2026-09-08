"use client";
import React, { useEffect } from "react";
import { toast } from "sonner";

export default function ClientLayout({
  children,
  error,
}: {
  children: React.ReactNode;
  error?: {
    status: number | string;
    message: string;
  };
}) {
  useEffect(() => {
    if (error) {
      requestAnimationFrame(() => {
        toast.error(`${error.status}: ${error.message}`);
      });
    }
  }, [error]);

  return error ? (
    <>Error</>
  ) : (
    <div className="w-full relative h-full flex gap-4">
      <div className="flex relative flex-1">{children}</div>
    </div>
  );
}
