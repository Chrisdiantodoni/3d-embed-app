"use client";

import { usePathname } from "next/navigation"; // Import ini
import { type LucideIcon } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavProjects({
  projects,
}: {
  projects: {
    name: string;
    url: string;
    icon: LucideIcon;
  }[];
}) {
  const pathname = usePathname(); // Ambil URL saat ini

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Main</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map((item) => {
          // Logika isActive: Cek apakah pathname sama dengan URL item
          const isActive = pathname === item.url;

          return (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton
                asChild
                isActive={isActive} // Kirim prop isActive ke SidebarMenuButton
                tooltip={item.name}
              >
                <a href={item.url}>
                  <item.icon />
                  <span>{item.name}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
