"use client";

import type { inferRouterOutputs } from "@trpc/server";
import type { ColumnDef } from "@tanstack/react-table";

import type { AppRouter } from "@full-tester/api/routers/index";
import { Eye, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export type Project = inferRouterOutputs<AppRouter>["projects"]["list"][number];

type ColumnActions = {
  onView: (project: Project) => void;
  onDelete: (project: Project) => void;
};

export function getColumns(actions: ColumnActions): ColumnDef<Project>[] {
  return [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "domainName",
      header: "Domain",
    },
    {
      accessorKey: "url",
      header: "URL",
      cell: ({ row }) => row.original.url || "—",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const project = row.original;
        return (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => actions.onView(project)}
            >
              <Eye />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => actions.onDelete(project)}
            >
              <Trash2 />
            </Button>
          </div>
        );
      },
    },
  ];
}
