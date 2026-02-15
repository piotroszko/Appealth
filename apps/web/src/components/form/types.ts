import type { AnyFieldApi } from "@tanstack/react-form";
import type { z } from "zod";

export type FieldType = "text" | "password";

export interface InputConfig<TValue = unknown> {
  type: FieldType;
  label: string;
  placeholder?: string;
  validator: z.ZodType<TValue>;
  defaultValue: TValue;
}

export type InputsRecord = Record<string, InputConfig>;

export type InferFormValues<T extends InputsRecord> = {
  [K in keyof T]: T[K]["defaultValue"];
};

export interface FieldComponentProps {
  field: AnyFieldApi;
  label: string;
  placeholder?: string;
  className?: string;
}
