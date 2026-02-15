"use client";

import type { inferRouterOutputs } from "@trpc/server";
import type { ColumnDef } from "@tanstack/react-table";

import type { AppRouter } from "@full-tester/api/routers/index";
import { Eye, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export type Project = inferRouterOutputs<AppRouter>["projects"]["list"][number];

type ColumnActions = {
  onView: (project: Project) => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
};

export function getColumns(actions: ColumnActions): ColumnDef<Project>[] {
  return [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <button type="button" className="cursor-pointer hover:underline text-left" onClick={() => actions.onView(row.original)}>
          {row.original.name}
        </button>
      ),
    },
    {
      accessorKey: "domainName",
      header: "Domain",
      cell: ({ row }) => (
        <button type="button" className="cursor-pointer hover:underline text-left" onClick={() => actions.onView(row.original)}>
          {row.original.domainName}
        </button>
      ),
    },
    {
      accessorKey: "url",
      header: "URL",
      cell: ({ row }) => {
        const url = row.original.url;
        if (!url) return "—";
        return (
          <button type="button" className="cursor-pointer hover:underline text-left" onClick={() => actions.onView(row.original)}>
            {url}
          </button>
        );
      },
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
              onClick={() => actions.onEdit(project)}
            >
              <Pencil />
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
