import type { FieldComponentProps } from "../types";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TextField({ field, label, placeholder, description }: FieldComponentProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={field.name}>{label}</Label>
      {description && (
        <p className="text-muted-foreground text-xs">{description}</p>
      )}
      <Input
        id={field.name}
        name={field.name}
        type="text"
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
