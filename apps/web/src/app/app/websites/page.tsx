"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { AppPage } from "@/components/app/app-page";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { queryClient, trpc } from "@/utils/trpc";

import { type Website, getColumns } from "./columns";

export default function WebsitesPage() {
  const { data = [] } = useQuery(trpc.websites.list.queryOptions());

  const deleteMutation = useMutation(
    trpc.websites.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.websites.list.queryKey() });
        toast.success("Website deleted");
      },
    }),
  );

  const columns = getColumns({
    onView: (website: Website) => {
      console.log("View website", website);
    },
    onEdit: (website: Website) => {
      console.log("Edit website", website);
    },
    onDelete: (website: Website) => {
      deleteMutation.mutate({ id: website._id });
    },
  });

  return (
    <AppPage breadcrumbs={[{ label: "Websites" }]}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Websites</h1>
        <Button onClick={() => console.log("Add website")}>
          <Plus data-icon="inline-start" />
          Add Website
        </Button>
      </div>
      <div className="mt-4">
        <DataTable columns={columns} data={data as Website[]} />
      </div>
    </AppPage>
  );
}
