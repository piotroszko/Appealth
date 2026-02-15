import type { Project } from "@/components/project/project-columns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function OverviewSection({ project }: { project: Project }) {
  return (
    <Card id="overview" className="scroll-mt-20">
      <CardHeader>
        <CardTitle>Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
            <p className="mt-1">{project.name}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Domain</h3>
            <p className="mt-1">{project.domainName}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">URL</h3>
            <p className="mt-1">{project.url || "—"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
