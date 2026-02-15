import type { ComponentType } from "react";

import type { FieldComponentProps, FieldType } from "../types";

import { CheckboxField } from "./checkbox-field";
import { EmailField } from "./email-field";
import { NumberField } from "./number-field";
import { PasswordField } from "./password-field";
import { SelectField } from "./select-field";
import { SwitchField } from "./switch-field";
import { TextField } from "./text-field";
import { TextareaField } from "./textarea-field";
import { UrlField } from "./url-field";
import { UrlsField } from "./urls-field";

export const FIELD_COMPONENTS: Record<FieldType, ComponentType<FieldComponentProps>> = {
  text: TextField,
  password: PasswordField,
  textarea: TextareaField,
  number: NumberField,
  email: EmailField,
  url: UrlField,
  select: SelectField,
  checkbox: CheckboxField,
  switch: SwitchField,
  urls: UrlsField,
};

export {
  CheckboxField,
  EmailField,
  NumberField,
  PasswordField,
  SelectField,
  SwitchField,
  TextField,
  TextareaField,
  UrlField,
  UrlsField,
};
