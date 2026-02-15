import type { FieldComponentProps } from "../types";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function SwitchField({ field, label, description }: FieldComponentProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Switch
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
