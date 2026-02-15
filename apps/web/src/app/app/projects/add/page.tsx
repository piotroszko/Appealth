"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AppPage } from "@/components/app/app-page";
import { ProjectForm } from "@/components/project/project-form";
import { queryClient, trpc } from "@/utils/trpc";

export default function AddProjectPage() {
  const router = useRouter();

  const createMutation = useMutation(
    trpc.projects.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.projects.list.queryKey() });
        toast.success("Project created");
        router.push("/app/projects");
      },
    }),
  );

  return (
    <AppPage
      breadcrumbs={[
        { label: "Projects", href: "/app/projects" },
        { label: "Add Project" },
      ]}
    >
      <h1 className="text-2xl font-bold">Add Project</h1>
      <div className="mt-4 max-w-2xl">
        <ProjectForm
          formKey="add-project"
          onSubmit={async (values) => { await createMutation.mutateAsync(values); }}
          submitLabel="Create Project"
        />
      </div>
    </AppPage>
  );
}
