"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/ui/data-table";

type SeoReport = {
  url: string;
  status: string;
  score: number;
  createdAt: string;
};

const columns: ColumnDef<SeoReport>[] = [
  { accessorKey: "url", header: "URL" },
  { accessorKey: "status", header: "Status" },
  { accessorKey: "score", header: "Score" },
  { accessorKey: "createdAt", header: "Created At" },
];

export function SeoReportsSection({ projectId: _projectId }: { projectId: string }) {
  return (
    <div id="seo-reports" className="scroll-mt-20 space-y-4">
      <h2 className="text-lg font-semibold">SEO Reports</h2>
      <DataTable columns={columns} data={[]} />
    </div>
  );
}
