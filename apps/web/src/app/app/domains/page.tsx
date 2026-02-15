"use client";

import { useState } from "react";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { AppPage } from "@/components/app/app-page";
import { Form } from "@/components/form";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { queryClient, trpc } from "@/utils/trpc";

import { type Domain, getColumns } from "./columns";

const addDomainInputs = {
  name: {
    type: "text" as const,
    label: "Name",
    placeholder: "e.g. My Project",
    validator: z.string().min(1, "Name is required"),
    defaultValue: "",
  },
  domain: {
    type: "text" as const,
    label: "Domain",
    placeholder: "e.g. example.com",
    validator: z.string().min(1, "Domain is required"),
    defaultValue: "",
  },
  websites: {
    type: "urls" as const,
    label: "Websites",
    placeholder: "e.g. example.com",
    validator: z.array(z.string()).default([]),
    defaultValue: [] as string[],
  },
  allowedExternalDomains: {
    type: "urls" as const,
    label: "Allowed External Domains",
    placeholder: "e.g. cdn.example.com",
    validator: z.array(z.string()).default([]),
    defaultValue: [] as string[],
  },
};

export default function DomainsPage() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { data = [] } = useQuery(trpc.domains.list.queryOptions());

  const createMutation = useMutation(
    trpc.domains.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.domains.list.queryKey() });
        toast.success("Domain created");
        setSheetOpen(false);
      },
    }),
  );

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
        <Button onClick={() => setSheetOpen(true)}>
          <Plus data-icon="inline-start" />
          Add Domain
        </Button>
      </div>
      <div className="mt-4">
        <DataTable columns={columns} data={data as Domain[]} />
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Add Domain</SheetTitle>
          </SheetHeader>
          <div className="p-4">
            <Form
              key={String(sheetOpen)}
              inputs={addDomainInputs}
              onSubmit={async (values) => { await createMutation.mutateAsync(values); }}
              submitLabel="Create Domain"
              className="space-y-4"
            />
          </div>
        </SheetContent>
      </Sheet>
    </AppPage>
  );
}
