"use client";

import type { ReactNode } from "react";

import { z } from "zod";

import { Form } from "@/components/form";

import type { Project } from "./project-columns";

function isPartOfDomain(url: string, domain: string): boolean {
  const withProtocol = url.match(/^https?:\/\//) ? url : `https://${url}`;
  try {
    const hostname = new URL(withProtocol).hostname;
    return hostname === domain || hostname.endsWith(`.${domain}`);
  } catch {
    return false;
  }
}

function getProjectInputs(project?: Project) {
  return {
    name: {
      type: "text" as const,
      label: "Name",
      placeholder: "e.g. My Project",
      description: "A descriptive name for easier identification.",
      validator: z.string().min(1, "Name is required"),
      defaultValue: project?.name ?? "",
    },
    domainName: {
      type: "text" as const,
      label: "Domain",
      placeholder: "e.g. example.com",
      description: "The domain itself, without protocol (http/https).",
      validator: z.string().min(1, "Domain is required"),
      defaultValue: project?.domainName ?? "",
    },
    url: {
      type: "text" as const,
      label: "URL",
      placeholder: "e.g. https://example.com",
      description: "The URL of the website. Must be within the specified domain.",
      validator: z.string().default(""),
      defaultValue: project?.url ?? "",
    },
  };
}

export type ProjectFormValues = {
  name: string;
  domainName: string;
  url: string;
};

interface ProjectFormProps {
  formKey: string;
  project?: Project;
  onSubmit: (values: ProjectFormValues) => Promise<void>;
  submitLabel: string;
  secondaryButton?: ReactNode | ((opts: { reset: () => void }) => ReactNode);
}

export function ProjectForm({ formKey, project, onSubmit, submitLabel, secondaryButton }: ProjectFormProps) {
  return (
    <Form
      key={formKey}
      inputs={getProjectInputs(project)}
      refine={(values, ctx) => {
        if (values.url && !isPartOfDomain(values.url, values.domainName)) {
          ctx.addIssue({
            code: "custom",
            message: `URL must be within the "${values.domainName}" domain`,
            path: ["url"],
          });
        }
      }}
      onSubmit={onSubmit}
      submitLabel={submitLabel}
      secondaryButton={secondaryButton}
      className="space-y-4"
    />
  );
}
