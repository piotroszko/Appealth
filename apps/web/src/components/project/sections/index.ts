import { Code, LayoutDashboard, Search } from "lucide-react";

export const PROJECT_SECTIONS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "seo-reports", label: "SEO Reports", icon: Search },
  { id: "html-validations", label: "HTML Validations", icon: Code },
] as const;
