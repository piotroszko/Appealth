import type { FieldComponentProps } from "../types";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function CheckboxField({ field, label, description }: FieldComponentProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Checkbox
          id={field.name}
          checked={field.state.value}
          onCheckedChange={(checked) => field.handleChange(checked)}
        />
        <Label htmlFor={field.name}>{label}</Label>
      </div>
      {description && (
        <p className="text-muted-foreground text-xs">{description}</p>
      )}
      {field.state.meta.errors.map((error) => (
        <p key={error?.message} className="text-red-500">
          {error?.message}
        </p>
      ))}
    </div>
  );
}
