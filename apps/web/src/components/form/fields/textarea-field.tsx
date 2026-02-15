import type { FieldComponentProps } from "../types";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function TextareaField({ field, label, placeholder }: FieldComponentProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={field.name}>{label}</Label>
      <Textarea
        id={field.name}
        name={field.name}
        placeholder={placeholder}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
      />
      {field.state.meta.errors.map((error) => (
        <p key={error?.message} className="text-red-500">
          {error?.message}
        </p>
      ))}
    </div>
  );
}
