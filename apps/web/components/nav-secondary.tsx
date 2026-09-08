"use client";

import * as React from "react";
import Link from "next/link";
import { Group, LayoutDashboard, Table, Upload } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useTraceStore } from "@/state/trace";
import { useProjectStore } from "@/state/project";

export function NavSecondary({
  ...props
}: {} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const traceList = useTraceStore((s) => s.traceList);
  const project = useProjectStore((s) => s.project);

  if (!project) {
    return null;
  }

  const items = [
    {
      title: "Overview",
      url: `/${project?.id}`,
      icon: LayoutDashboard,
    },
    {
      title: "Upload",
      url: `/${project?.id}/upload`,
      icon: Upload,
    },
  ];

  const traceListItems = [
    {
      title: "Axial codes",
      url: `/${project.id}/${traceList?.id}/axial-codes`,
      icon: Group,
    },
    {
      title: "Traces",
      url: `/${project.id}/${traceList?.id}/traces`,
      icon: Table,
    },
  ];

  return (
    <>
      <SidebarGroup {...props}>
        <SidebarGroupLabel>Project &#39;{project.name}&#39;</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild size="sm">
                  <Link href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {Boolean(traceList) && (
        <SidebarGroup>
          <SidebarGroupLabel>
            Tracelist &#39;{traceList?.name || "Untitled"}&#39;
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {traceListItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild size="sm">
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}
    </>
  );
}
