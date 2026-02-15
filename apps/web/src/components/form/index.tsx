"use client";

import type { ReactNode } from "react";

import type { FormValidateOrFn } from "@tanstack/react-form";
import { useForm } from "@tanstack/react-form";

import { Button } from "@/components/ui/button";

import { FIELD_COMPONENTS } from "./fields";
import type { InferFormValues, InputsRecord } from "./types";
import { buildDefaultValues, buildValidator } from "./utils";

interface FormProps<T extends InputsRecord> {
  inputs: T;
  onSubmit: (values: InferFormValues<T>) => void | Promise<void>;
  submitLabel?: string;
  className?: string;
  children?: ReactNode;
}

export function Form<T extends InputsRecord>({
  inputs,
  onSubmit,
  submitLabel = "Submit",
  className,
  children,
}: FormProps<T>) {
  const form = useForm({
    defaultValues: buildDefaultValues(inputs),
    onSubmit: async ({ value }) => {
      await onSubmit(value as InferFormValues<T>);
    },
    validators: {
      onSubmit: buildValidator(inputs) as FormValidateOrFn<InferFormValues<T>>,
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
                />
              )}
            </form.Field>
          </div>
        );
      })}

      <form.Subscribe>
        {(state) => (
          <Button
            type="submit"
            className="w-full"
            disabled={!state.canSubmit || state.isSubmitting}
          >
            {state.isSubmitting ? "Submitting..." : submitLabel}
          </Button>
        )}
      </form.Subscribe>

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
