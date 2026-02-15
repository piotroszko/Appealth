import { Home } from "lucide-react";
import Link, { type LinkProps } from "next/link";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export type BreadcrumbEntry = {
  label: string;
  href?: LinkProps["href"];
};

export function AppBreadcrumbs({ items = [] }: { items?: BreadcrumbEntry[] }) {

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink className="cursor-pointer" render={<Link href="/app" />}>
            <Home className="size-4" />
          </BreadcrumbLink>
        </BreadcrumbItem>

        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <BreadcrumbItem key={item.label}>
              <BreadcrumbSeparator />
              {isLast || !item.href ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink className="cursor-pointer" render={<Link href={item.href} />}>{item.label}</BreadcrumbLink>
              )}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
