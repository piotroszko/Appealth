"use client";

import type { inferRouterOutputs } from "@trpc/server";
import type { ColumnDef } from "@tanstack/react-table";

import type { AppRouter } from "@full-tester/api/routers/index";
import { Eye, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export type Domain = inferRouterOutputs<AppRouter>["domains"]["list"][number];

type ColumnActions = {
  onView: (domain: Domain) => void;
  onEdit: (domain: Domain) => void;
  onDelete: (domain: Domain) => void;
};

export function getColumns(actions: ColumnActions): ColumnDef<Domain>[] {
  return [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "domain",
      header: "Domain",
    },
    {
      accessorKey: "websites",
      header: "Websites",
      cell: ({ row }) => {
        const websites = row.original.websites;
        if (!websites || websites.length === 0) return "—";
        return websites.join(", ");
      },
    },
    {
      accessorKey: "allowedExternalDomains",
      header: "Allowed External Domains",
      cell: ({ row }) => {
        const domains = row.original.allowedExternalDomains;
        if (!domains || domains.length === 0) return "—";
        return domains.join(", ");
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const domain = row.original;
        return (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => actions.onView(domain)}
            >
              <Eye />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => actions.onEdit(domain)}
            >
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => actions.onDelete(domain)}
            >
              <Trash2 />
            </Button>
          </div>
        );
      },
    },
  ];
}
