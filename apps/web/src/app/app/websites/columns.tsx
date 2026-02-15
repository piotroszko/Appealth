"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { Eye, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export type Website = {
  _id: string;
  name: string;
  url: string;
  createdAt: string;
  updatedAt: string;
};

type ColumnActions = {
  onView: (website: Website) => void;
  onEdit: (website: Website) => void;
  onDelete: (website: Website) => void;
};

export function getColumns(actions: ColumnActions): ColumnDef<Website>[] {
  return [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "url",
      header: "URL",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const website = row.original;
        return (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => actions.onView(website)}
            >
              <Eye />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => actions.onEdit(website)}
            >
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => actions.onDelete(website)}
            >
              <Trash2 />
            </Button>
          </div>
        );
      },
    },
  ];
}
