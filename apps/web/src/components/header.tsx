"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { authClient } from "@/lib/auth-client";

import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

export default function Header({ logo }: { logo: ReactNode }) {
  const { data: session } = authClient.useSession();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex max-w-6xl items-center justify-between px-4 py-2">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            {logo}
            <span className="text-lg font-bold tracking-tight">Appealth</span>
          </Link>

          {/* Nav links — hidden on mobile, hidden when logged in */}
          {!session && (
            <nav className="hidden items-center gap-4 text-sm md:flex">
              <a
                href="#features"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                How It Works
              </a>
              <a
                href="#why-us"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Why Appealth?
              </a>
            </nav>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <ModeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
