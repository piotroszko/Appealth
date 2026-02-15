import type { Project } from "@/components/project/project-columns";

import { HtmlValidationsSection } from "./html-validations-section";
import { OverviewSection } from "./overview-section";
import { SeoReportsSection } from "./seo-reports-section";

export function ProjectSections({ project }: { project: Project }) {
  const projectId = project._id as string;

  return (
    <div className="space-y-8">
      <OverviewSection project={project} />
      <SeoReportsSection projectId={projectId} />
      <HtmlValidationsSection projectId={projectId} />
    </div>
  );
}
