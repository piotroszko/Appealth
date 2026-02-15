"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="size-8" />;

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative flex h-8 w-14 cursor-pointer items-center rounded-full border bg-muted p-0.5 transition-colors hover:bg-accent"
      aria-label="Toggle theme"
    >
      <Sun className="absolute left-1.5 size-3.5 text-muted-foreground" />
      <Moon className="absolute right-1.5 size-3.5 text-muted-foreground" />
      <span
        className="size-6 rounded-full bg-primary shadow-sm transition-transform duration-200"
        style={{ transform: isDark ? "translateX(24px)" : "translateX(0)" }}
      />
    </button>
  );
}
