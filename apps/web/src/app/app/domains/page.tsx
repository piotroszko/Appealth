"use client";

import { useState } from "react";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { AppPage } from "@/components/app/app-page";
import { DeleteDomainDialog } from "@/components/domain/delete-domain-dialog";
import { type Domain, getColumns } from "@/components/domain/domain-columns";
import { DomainForm } from "@/components/domain/domain-form";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { queryClient, trpc } from "@/utils/trpc";

export default function DomainsPage() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [domainToEdit, setDomainToEdit] = useState<Domain | null>(null);
  const [domainToDelete, setDomainToDelete] = useState<Domain | null>(null);
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

  const updateMutation = useMutation(
    trpc.domains.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.domains.list.queryKey() });
        toast.success("Domain updated");
        setDomainToEdit(null);
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
      setDomainToEdit(domain);
    },
    onDelete: (domain: Domain) => {
      setDomainToDelete(domain);
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
        <DataTable columns={columns} data={data} />
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Add Domain</SheetTitle>
          </SheetHeader>
          <div className="p-4">
            <DomainForm
              formKey={String(sheetOpen)}
              onSubmit={async (values) => { await createMutation.mutateAsync(values); }}
              submitLabel="Create Domain"
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={!!domainToEdit} onOpenChange={(open) => { if (!open) setDomainToEdit(null); }}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit Domain</SheetTitle>
          </SheetHeader>
          <div className="p-4">
            {domainToEdit && (
              <DomainForm
                formKey={domainToEdit._id as string}
                domain={domainToEdit}
                onSubmit={async (values) => {
                  await updateMutation.mutateAsync({ id: domainToEdit._id as string, ...values });
                }}
                submitLabel="Save Changes"
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      <DeleteDomainDialog
        domain={domainToDelete}
        onOpenChange={(open) => { if (!open) setDomainToDelete(null); }}
        onConfirm={(domain) => {
          deleteMutation.mutate({ id: domain._id as string });
          setDomainToDelete(null);
        }}
      />
    </AppPage>
  );
}
