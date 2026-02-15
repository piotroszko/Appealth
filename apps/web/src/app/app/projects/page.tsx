"use client";

import { useState } from "react";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AppPage } from "@/components/app/app-page";
import { DeleteProjectDialog } from "@/components/project/delete-project-dialog";
import { type Project, getColumns } from "@/components/project/project-columns";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { queryClient, trpc } from "@/utils/trpc";

export default function ProjectsPage() {
  const router = useRouter();
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const { data = [] } = useQuery(trpc.projects.list.queryOptions());

  const deleteMutation = useMutation(
    trpc.projects.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.projects.list.queryKey() });
        toast.success("Project deleted");
      },
    }),
  );

  const columns = getColumns({
    onView: (project: Project) => {
      router.push(`/app/projects/view/${project._id}`);
    },
    onDelete: (project: Project) => {
      setProjectToDelete(project);
    },
  });

  return (
    <AppPage breadcrumbs={[{ label: "Projects" }]}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Button nativeButton={false} render={<Link href="/app/projects/add" />}>
          <Plus data-icon="inline-start" />
          Add Project
        </Button>
      </div>
      <div className="mt-4">
        <DataTable columns={columns} data={data} />
      </div>

      <DeleteProjectDialog
        project={projectToDelete}
        onOpenChange={(open) => { if (!open) setProjectToDelete(null); }}
        onConfirm={(project) => {
          deleteMutation.mutate({ id: project._id as string });
          setProjectToDelete(null);
        }}
      />
    </AppPage>
  );
}
