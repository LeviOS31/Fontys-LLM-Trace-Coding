import type { Metadata } from "next";
import { cookies } from "next/headers";

import "./globals.css";

import { Toaster } from "@/components/ui/sonner";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { BreadcrumbsWrapper } from "@/components/breadcrumbs-wrapper";
import { LoadingContextProvider } from "@/components/loading-context";
import { JobReviewProvider } from "@/components/job-review-provider";

import { version } from "../package.json";
import StoreResetter from "@/components/store-resetter";

export const metadata: Metadata = {
  title: "LLM-trace coding",
  description: "Open-/axial-code based LLM evaluations",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  return (
    <html lang="en">
      <body className={`antialiased h-dvh`}>
      <StoreResetter/>
        <LoadingContextProvider>
          <SidebarProvider defaultOpen={defaultOpen}>
            <AppSidebar version={version} />
            <BreadcrumbsWrapper>{children}</BreadcrumbsWrapper>
          </SidebarProvider>
          <Toaster position="top-right" />
          <JobReviewProvider />
        </LoadingContextProvider>
      </body>
    </html>
  );
}
