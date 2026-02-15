import { auth } from "@full-tester/auth";
import Image from "next/image";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app/app-shell";

import logo from "../logo.svg";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/auth/login");
  }

  return (
    <AppShell
      logo={<Image src={logo} alt="Appealth logo" className="size-6" />}
      user={{ name: session.user.name, email: session.user.email }}
    >
      {children}
    </AppShell>
  );
}
