"use client";

import { use } from "react";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AppPage } from "@/components/app/app-page";
import { ProjectForm } from "@/components/project/project-form";
import { queryClient, trpc } from "@/utils/trpc";

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const { data: project, isLoading } = useQuery(trpc.projects.get.queryOptions({ id }));

  const updateMutation = useMutation(
    trpc.projects.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.projects.list.queryKey() });
        toast.success("Project updated");
        router.push("/app/projects");
      },
    }),
  );

  if (isLoading) {
    return (
      <AppPage
        breadcrumbs={[
          { label: "Projects", href: "/app/projects" },
          { label: "Edit Project" },
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
          { label: "Edit Project" },
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
        { label: "Edit Project" },
      ]}
    >
      <h1 className="text-2xl font-bold">Edit Project</h1>
      <div className="mt-4 max-w-2xl">
        <ProjectForm
          formKey={id}
          project={project}
          onSubmit={async (values) => {
            await updateMutation.mutateAsync({ id, ...values });
          }}
          submitLabel="Save Changes"
        />
      </div>
    </AppPage>
  );
}
