"use client";

import { ReactNode, useContext, useEffect } from "react";
import { BreadcrumbsContext } from "@/components/breadcrumbs-wrapper";


export function HeaderActions({ children }: { children: ReactNode }) {
  const breadcrumbContext = useContext(BreadcrumbsContext);

  useEffect(() => {
    breadcrumbContext?.setHeaderActions(children);

    return () => {
      breadcrumbContext?.setHeaderActions(null);
    };
  }, [children, breadcrumbContext]);

  return null;
}
