"use client";

import {
  createContext,
  Dispatch,
  PropsWithChildren,
  ReactNode,
  SetStateAction,
  useState,
} from "react";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import BreadcrumbHandler from "@/components/breadcrumb-handler";

export type BreadcrumbsContextValue = {
  setHeaderActions: Dispatch<SetStateAction<ReactNode>>;
};

export const BreadcrumbsContext = createContext<
  BreadcrumbsContextValue | undefined
>(undefined);

export function BreadcrumbsWrapper({ children }: PropsWithChildren) {
  const [headerActions, setHeaderActions] = useState<ReactNode>(null);

  return (
    <BreadcrumbsContext.Provider
      value={{ setHeaderActions }}
    >
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <BreadcrumbHandler/>
          </div>
          {headerActions && (
            <div className="ml-auto flex items-center gap-2">
              {headerActions}
            </div>
          )}
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 overflow-auto">
          {children}
        </div>
      </SidebarInset>
    </BreadcrumbsContext.Provider>
  );
}
