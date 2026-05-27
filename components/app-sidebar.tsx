"use client";

import * as React from "react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import {
  FolderKanban,
  Globe,
  Library,
  Box,
  LayoutDashboard,
  BarChart3,
  Settings,
  Crown,
} from "lucide-react";

import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarGroup,
} from "@/components/ui/sidebar";

const navMain = [
  {
    name: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Projects",
    url: "/projects",
    icon: FolderKanban,
  },
  {
    name: "Asset Library",
    url: "/assets-library",
    icon: Library,
  },
  {
    name: "Domains",
    url: "/domains",
    icon: Globe,
  },
  {
    name: "Analytics",
    url: "/analytics",
    icon: BarChart3,
  },
];

const navBottom = [
  {
    name: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Box className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Vur3D</span>
                  <span className="truncate text-xs">Free</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavProjects projects={navMain} label="Workspace" />
        <NavProjects projects={navBottom} label="" />
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() =>
                  toast("Upgrade coming soon.", {
                    description:
                      "Enjoy unlimited access during the free beta. Paid plans are on the way!",
                  })
                }
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Crown className="size-4" />
                <span>Upgrade</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user ?? null} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
