"use client";

import { useState } from "react";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { AppPage } from "@/components/app/app-page";
import { Form } from "@/components/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

function getDomainInputs(domain?: Domain) {
  return {
    name: {
      type: "text" as const,
      label: "Name",
      placeholder: "e.g. My Project",
      description: "A descriptive name for easier identification.",
      validator: z.string().min(1, "Name is required"),
      defaultValue: domain?.name ?? "",
    },
    domain: {
      type: "text" as const,
      label: "Domain",
      placeholder: "e.g. example.com",
      description: "The domain itself, without protocol (http/https).",
      validator: z.string().min(1, "Domain is required"),
      defaultValue: domain?.domain ?? "",
    },
    websites: {
      type: "urls" as const,
      label: "Websites",
      placeholder: "e.g. example.com",
      description:
        "Websites hosted on this domain. Include all sites on the main domain and subdomains that should be included in checks.",
      validator: z.array(z.string()).default([]),
      defaultValue: (domain?.websites ?? []) as string[],
    },
    allowedExternalDomains: {
      type: "urls" as const,
      label: "Allowed External Domains",
      placeholder: "e.g. cdn.example.com",
      description:
        "External domains you are authorized to run security checks against. Any external links not listed here will be skipped.",
      validator: z.array(z.string()).default([]),
      defaultValue: (domain?.allowedExternalDomains ?? []) as string[],
    },
  };
}

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
            <Form
              key={String(sheetOpen)}
              inputs={getDomainInputs()}
              onSubmit={async (values) => { await createMutation.mutateAsync(values); }}
              submitLabel="Create Domain"
              className="space-y-4"
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
              <Form
                key={domainToEdit._id as string}
                inputs={getDomainInputs(domainToEdit)}
                onSubmit={async (values) => {
                  await updateMutation.mutateAsync({ id: domainToEdit._id as string, ...values });
                }}
                submitLabel="Save Changes"
                className="space-y-4"
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!!domainToDelete}
        onOpenChange={(open) => { if (!open) setDomainToDelete(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete domain</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{domainToDelete?.name}</strong>? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (domainToDelete) {
                  deleteMutation.mutate({ id: domainToDelete._id as string });
                  setDomainToDelete(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppPage>
  );
}
