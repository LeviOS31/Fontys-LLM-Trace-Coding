import React from "react";

import { HeaderActions } from "@/components/header-actions";
import JobViewer from "@/components/job-viewer";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-row gap-5 w-full max-h-full h-full`}>
      <HeaderActions>
        <JobViewer />
      </HeaderActions>
      {children}
    </div>
  );
}
