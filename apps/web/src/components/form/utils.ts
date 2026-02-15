import z from "zod";

import type { InferFormValues, InputsRecord } from "./types";

export function buildDefaultValues<T extends InputsRecord>(inputs: T): InferFormValues<T> {
  const defaults = {} as Record<string, unknown>;
  for (const [key, config] of Object.entries(inputs)) {
    defaults[key] = config.defaultValue;
  }
  return defaults as InferFormValues<T>;
}

export function buildValidator<T extends InputsRecord>(inputs: T) {
  const shape = {} as Record<string, z.ZodType>;
  for (const [key, config] of Object.entries(inputs)) {
    shape[key] = config.validator;
  }
  return z.object(shape);
}
