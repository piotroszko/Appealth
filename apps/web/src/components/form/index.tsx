"use client";

import type { ReactNode } from "react";

import type { FormValidateOrFn } from "@tanstack/react-form";
import { useForm } from "@tanstack/react-form";
import type { RefinementCtx } from "zod";

import { Button } from "@/components/ui/button";

import { FIELD_COMPONENTS } from "./fields";
import type { InferFormValues, InputsRecord } from "./types";
import { buildDefaultValues, buildValidator } from "./utils";

interface FormProps<T extends InputsRecord> {
  inputs: T;
  onSubmit: (values: InferFormValues<T>) => void | Promise<void>;
  refine?: (values: InferFormValues<T>, ctx: RefinementCtx) => void;
  submitLabel?: string;
  secondaryButton?: ReactNode | ((opts: { reset: () => void }) => ReactNode);
  className?: string;
  children?: ReactNode;
}

export function Form<T extends InputsRecord>({
  inputs,
  onSubmit,
  refine,
  submitLabel = "Submit",
  secondaryButton,
  className,
  children,
}: FormProps<T>) {
  const baseSchema = buildValidator(inputs);
  const schema = refine
    ? baseSchema.superRefine((val, ctx) => refine(val as InferFormValues<T>, ctx))
    : baseSchema;

  const form = useForm({
    defaultValues: buildDefaultValues(inputs),
    onSubmit: async ({ value }) => {
      await onSubmit(value as InferFormValues<T>);
    },
    validators: {
      onSubmit: schema as FormValidateOrFn<InferFormValues<T>>,
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className={className}
    >
      <div className="space-y-6">
        {Object.entries(inputs).map(([name, config]) => {
          const FieldComponent = FIELD_COMPONENTS[config.type];
          return (
            <div key={name}>
              <form.Field name={name}>
                {(field) => (
                  <FieldComponent
                    field={field}
                    label={config.label}
                    placeholder={config.placeholder}
                    options={config.options}
                    description={config.description}
                  />
                )}
              </form.Field>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex gap-2">
        {typeof secondaryButton === "function" ? secondaryButton({ reset: () => form.reset() }) : secondaryButton}
        <form.Subscribe>
          {(state) => (
            <Button
              type="submit"
              className="flex-1"
              disabled={!state.canSubmit || state.isSubmitting}
            >
              {state.isSubmitting ? "Submitting..." : submitLabel}
            </Button>
          )}
        </form.Subscribe>
      </div>

      {children}
    </form>
  );
}

export type {
  FieldComponentProps,
  FieldType,
  InferFormValues,
  InputConfig,
  InputsRecord,
} from "./types";
