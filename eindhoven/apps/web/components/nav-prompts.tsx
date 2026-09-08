"use client";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { usePromptState } from "@/state/prompt";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavPrompts({
  ...props
}: {} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const route = usePathname();
  const prompts = usePromptState((state) => state.prompts);

  const isActive = route.includes("/prompts");

  if (!isActive) {
    return null;
  }

  const uniqueGroups = Array.from(
    new Set(prompts.map((p) => p.promptType.replace(/_(USER|SYSTEM)$/, ""))),
  );

  const promptGroups = uniqueGroups.map((originalGroup) => ({
    label: originalGroup
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" "),
    value: originalGroup,
  }));

  return (
    <SidebarGroup {...props}>
      <SidebarGroupLabel>Prompts</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {promptGroups.map(({ label, value }) => (
            <SidebarMenuItem key={value}>
              <SidebarMenuButton asChild size="sm">
                <Link href={"/prompts?type=" + value + "_SYSTEM"}>
                  <span>{label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
