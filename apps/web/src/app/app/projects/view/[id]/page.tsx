"use client";

import { use, useState } from "react";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AppPage } from "@/components/app/app-page";
import { DeleteProjectDialog } from "@/components/project/delete-project-dialog";
import type { Project } from "@/components/project/project-columns";
import { ProjectSections } from "@/components/project/sections/project-sections";
import { Button } from "@/components/ui/button";
import { queryClient, trpc } from "@/utils/trpc";

export default function ViewProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const { data: project, isLoading } = useQuery(trpc.projects.get.queryOptions({ id }));

  const deleteMutation = useMutation(
    trpc.projects.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.projects.list.queryKey() });
        toast.success("Project deleted");
        router.push("/app/projects");
      },
    }),
  );

  if (isLoading) {
    return (
      <AppPage
        breadcrumbs={[
          { label: "Projects", href: "/app/projects" },
          { label: "Loading..." },
        ]}
      >
        <p>Loading...</p>
      </AppPage>
    );
  }

  if (!project) {
    return (
      <AppPage
        breadcrumbs={[
          { label: "Projects", href: "/app/projects" },
          { label: "Not Found" },
        ]}
      >
        <p>Project not found.</p>
      </AppPage>
    );
  }

  return (
    <AppPage
      breadcrumbs={[
        { label: "Projects", href: "/app/projects" },
        { label: project.name },
      ]}
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <div className="flex gap-2">
          <Button nativeButton={false} variant="outline" render={<Link href={`/app/projects/edit/${id}`} />}>
            <Pencil data-icon="inline-start" />
            Edit
          </Button>
          <Button variant="destructive" onClick={() => setProjectToDelete(project as Project)}>
            <Trash2 data-icon="inline-start" />
            Delete
          </Button>
        </div>
      </div>

      <div className="mt-6">
        <ProjectSections project={project as Project} />
      </div>

      <DeleteProjectDialog
        project={projectToDelete}
        onOpenChange={(open) => { if (!open) setProjectToDelete(null); }}
        onConfirm={(p) => {
          deleteMutation.mutate({ id: p._id as string });
          setProjectToDelete(null);
        }}
      />
    </AppPage>
  );
}
