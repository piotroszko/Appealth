"use client";

import type { ReactNode } from "react";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

import { AppBreadcrumbs, type BreadcrumbEntry } from "./app-breadcrumbs";

export function AppPage({
  breadcrumbs,
  children,
}: {
  breadcrumbs?: BreadcrumbEntry[];
  children: ReactNode;
}) {
  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1 cursor-pointer" />
        <Separator
          orientation="vertical"
          className="mr-2 data-vertical:h-4 data-vertical:self-auto"
        />
        <AppBreadcrumbs items={breadcrumbs} />
      </header>
      <div className="flex flex-1 flex-col p-4">{children}</div>
    </>
  );
}
