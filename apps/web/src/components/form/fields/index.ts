import type { ComponentType } from "react";

import type { FieldComponentProps, FieldType } from "../types";

import { PasswordField } from "./password-field";
import { TextField } from "./text-field";

export const FIELD_COMPONENTS: Record<FieldType, ComponentType<FieldComponentProps>> = {
  text: TextField,
  password: PasswordField,
};

export { PasswordField, TextField };
