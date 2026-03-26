"use client";

import React from "react";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";

export function AutoBreadcrumbs() {
  const pathname = usePathname();

  // Memecah path: "/admin/settings/profile" -> ["admin", "settings", "profile"]
  const pathSegments = pathname.split("/").filter((item) => item !== "");

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {/* Selalu tampilkan Home sebagai root */}
        <BreadcrumbItem>
          <BreadcrumbLink href="/" className="flex items-center gap-1">
            <span>Home</span>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {pathSegments.map((segment, index) => {
          const href = `/${pathSegments.slice(0, index + 1).join("/")}`;
          const isLast = index === pathSegments.length - 1;

          // Format teks: "asset-library" -> "Asset Library"
          const title = segment
            .replace(/-/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase());

          return (
            <React.Fragment key={href}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{title}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={href}>{title}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
