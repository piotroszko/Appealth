"use client";

import { useEffect, useState } from "react";

import { PROJECT_SECTIONS } from "@/components/project/sections";

export function useActiveSection(enabled: boolean) {
  const [activeSectionId, setActiveSectionId] = useState<string>(PROJECT_SECTIONS[0].id);

  useEffect(() => {
    if (!enabled) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSectionId(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -60% 0px" },
    );

    const sectionIds = PROJECT_SECTIONS.map((s) => s.id);
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    for (const el of elements) {
      observer.observe(el);
    }

    return () => observer.disconnect();
  }, [enabled]);

  return activeSectionId;
}
