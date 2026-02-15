"use client";

import type { ReactNode } from "react";

import { FolderKanban, Home, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { PROJECT_SECTIONS } from "@/components/project/sections";
import { useActiveSection } from "@/hooks/use-active-section";

import { authClient } from "@/lib/auth-client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
} from "@/components/ui/sidebar";

export function AppShell({
  logo,
  user,
  children,
}: {
  logo: ReactNode;
  user: { name: string; email: string };
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isProjectDetailPage =
    pathname.startsWith("/app/projects/view/") || pathname.startsWith("/app/projects/edit/");
  const activeSectionId = useActiveSection(isProjectDetailPage);

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" render={<Link href="/app" />}>
                {logo}
                <span className="text-lg font-bold">Appealth</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={pathname === "/app"} className="cursor-pointer" render={<Link href="/app" />}>
                    <Home className="size-4" />
                    Dashboard
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={pathname.startsWith("/app/projects")} className="cursor-pointer" render={<Link href="/app/projects" />}>
                    <FolderKanban className="size-4" />
                    Projects
                  </SidebarMenuButton>
                  {isProjectDetailPage && (
                    <SidebarMenuSub>
                      {PROJECT_SECTIONS.map((section) => (
                        <SidebarMenuSubItem key={section.id}>
                          <SidebarMenuSubButton
                            isActive={activeSectionId === section.id}
                            className="cursor-pointer"
                            onClick={() => {
                              document.getElementById(section.id)?.scrollIntoView({ behavior: "smooth" });
                            }}
                          >
                            <section.icon className="size-4" />
                            {section.label}
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex flex-col gap-1 px-2 py-2">
                <span className="text-sm font-medium">{user.name}</span>
                <span className="text-xs text-muted-foreground">{user.email}</span>
              </div>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => {
                  authClient.signOut({
                    fetchOptions: {
                      onSuccess: () => router.push("/"),
                    },
                  });
                }}
              >
                <LogOut className="size-4" />
                Sign Out
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
