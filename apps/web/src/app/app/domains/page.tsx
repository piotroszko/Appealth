"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { AppPage } from "@/components/app/app-page";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { queryClient, trpc } from "@/utils/trpc";

import { type Domain, getColumns } from "./columns";

export default function DomainsPage() {
  const { data = [] } = useQuery(trpc.domains.list.queryOptions());

  const deleteMutation = useMutation(
    trpc.domains.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.domains.list.queryKey() });
        toast.success("Domain deleted");
      },
    }),
  );

  const columns = getColumns({
    onView: (domain: Domain) => {
      console.log("View domain", domain);
    },
    onEdit: (domain: Domain) => {
      console.log("Edit domain", domain);
    },
    onDelete: (domain: Domain) => {
      deleteMutation.mutate({ id: domain._id });
    },
  });

  return (
    <AppPage breadcrumbs={[{ label: "Domains" }]}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Domains</h1>
        <Button onClick={() => console.log("Add domain")}>
          <Plus data-icon="inline-start" />
          Add Domain
        </Button>
      </div>
      <div className="mt-4">
        <DataTable columns={columns} data={data as Domain[]} />
      </div>
    </AppPage>
  );
}
