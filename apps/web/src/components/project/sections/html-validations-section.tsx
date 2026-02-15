"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/ui/data-table";

type HtmlValidation = {
  url: string;
  errors: number;
  warnings: number;
  createdAt: string;
};

const columns: ColumnDef<HtmlValidation>[] = [
  { accessorKey: "url", header: "URL" },
  { accessorKey: "errors", header: "Errors" },
  { accessorKey: "warnings", header: "Warnings" },
  { accessorKey: "createdAt", header: "Created At" },
];

export function HtmlValidationsSection({ projectId: _projectId }: { projectId: string }) {
  return (
    <div id="html-validations" className="scroll-mt-20 space-y-4">
      <h2 className="text-lg font-semibold">HTML Validations</h2>
      <DataTable columns={columns} data={[]} />
    </div>
  );
}
