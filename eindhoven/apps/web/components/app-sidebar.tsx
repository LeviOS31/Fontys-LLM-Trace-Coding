"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Bot,
  CheckCircle,
  Settings,
  SquareChartGantt,
  SquareTerminal,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Tracelist from "@/components/tracelist/list/tracelist";
import AxialCodeList from "@/components/axial-code/axial-code-list";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import NavPrompts from "@/components/nav-prompts";
import { Button } from "@/components/ui/button";
import { Spinner } from "./ui/spinner";
import { Item, ItemContent, ItemMedia, ItemTitle } from "./ui/item";

const data = {
  navMain: [
    {
      title: "Projects",
      url: "/",
      icon: SquareTerminal,
      isActive: true,
    },
  ],
};

export function AppSidebar({
  version,
  ...props
}: { version: string } & React.ComponentProps<typeof Sidebar>) {
  const [aiStatus, setAiStatus] = React.useState<"ok" | "error" | null>(null);
  const aiStatusText = `LLM ${aiStatus === null ? "Loading..." : aiStatus === "ok" ? "Operational" : "Error"}`;

  React.useEffect(() => {
    let timeout: NodeJS.Timeout;

    const load = async () => {
      const res = await fetch("/api/status/ai");
      const { status, revalidateAfter } = await res.json();

      setAiStatus(status);
      if (revalidateAfter) {
        const timeoutDuration =
          new Date(revalidateAfter).getTime() - Date.now();
        timeout = setTimeout(load, timeoutDuration);
      }

      console.log({ status, revalidateAfter });
    };
    load();

    return () => clearTimeout(timeout);
  }, []);

  return (
    <>
      <Sidebar
        collapsible="icon"
        className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
        {...props}
      >
        <Sidebar
          collapsible="icon"
          // className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r"
        >
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" asChild>
                  <Link href="/">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                      <Bot className="size-4" />
                    </div>
                    <div className="flex flex-col gap-0.5 leading-none">
                      <span className="font-medium">LLM-trace coding</span>
                      <span className="">{version}</span>
                    </div>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
          <SidebarContent>
            <NavMain items={data.navMain} />
            <NavSecondary />
            <NavPrompts />
          </SidebarContent>
          <SidebarFooter className={`mt-auto`}>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={aiStatusText}>
                  <Item
                    variant="default"
                    size="sm"
                    className={`flex-nowrap overflow-hidden p-2 border-none hover:bg-transparent!`}
                  >
                    <ItemMedia>
                      {aiStatus === null ? (
                        <Spinner />
                      ) : aiStatus === "ok" ? (
                        <CheckCircle className="size-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="size-4 text-orange-500" />
                      )}
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle className="text-[14px] leading-none text-nowrap font-normal">
                        {aiStatusText}
                      </ItemTitle>
                    </ItemContent>
                  </Item>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <HoverCard openDelay={200}>
                  <HoverCardTrigger
                    asChild
                    style={{
                      padding: "8px !important",
                      height: "auto !important",
                    }}
                  >
                    <SidebarMenuButton size="lg" asChild>
                      <div>
                        <Settings className="size-4" />
                        <div className="flex flex-col leading-none">
                          <span>Settings</span>
                        </div>
                      </div>
                    </SidebarMenuButton>
                  </HoverCardTrigger>
                  <HoverCardContent
                    side="right"
                    align={"end"}
                    className="p-0 ml-2"
                  >
                    <Link href="/prompts?type=AXIAL_CODE_GENERATION_SYSTEM">
                      <Button
                        variant={"ghost"}
                        className={`w-full justify-start`}
                      >
                        <SquareChartGantt />
                        Manage prompts
                      </Button>
                    </Link>
                    <Link href="/model">
                      <Button
                        variant={"ghost"}
                        className={`w-full justify-start`}
                      >
                        <Bot />
                        <span>Change model</span>
                      </Button>
                    </Link>
                  </HoverCardContent>
                </HoverCard>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
      </Sidebar>
      <Tracelist />
      <AxialCodeList />
    </>
  );
}
