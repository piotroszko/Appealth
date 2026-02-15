"use client";

import { z } from "zod";

import { Form } from "@/components/form";

import type { Domain } from "./domain-columns";

function isPartOfDomain(website: string, domain: string): boolean {
  const withProtocol = website.match(/^https?:\/\//) ? website : `https://${website}`;
  try {
    const hostname = new URL(withProtocol).hostname;
    return hostname === domain || hostname.endsWith(`.${domain}`);
  } catch {
    return false;
  }
}

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
    domainName: {
      type: "text" as const,
      label: "Domain",
      placeholder: "e.g. example.com",
      description: "The domain itself, without protocol (http/https).",
      validator: z.string().min(1, "Domain is required"),
      defaultValue: domain?.domainName ?? "",
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

export type DomainFormValues = {
  name: string;
  domainName: string;
  websites: string[];
  allowedExternalDomains: string[];
};

interface DomainFormProps {
  formKey: string;
  domain?: Domain;
  onSubmit: (values: DomainFormValues) => Promise<void>;
  submitLabel: string;
}

export function DomainForm({ formKey, domain, onSubmit, submitLabel }: DomainFormProps) {
  return (
    <Form
      key={formKey}
      inputs={getDomainInputs(domain)}
      refine={(values, ctx) => {
        const invalid = values.websites.filter((w) => !isPartOfDomain(w, values.domainName));
        if (invalid.length > 0) {
          ctx.addIssue({
            code: "custom",
            message: `Not part of "${values.domainName}" domain: ${invalid.join(", ")}`,
            path: ["websites"],
          });
        }
      }}
      onSubmit={onSubmit}
      submitLabel={submitLabel}
      className="space-y-4"
    />
  );
}
