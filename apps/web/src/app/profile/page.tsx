import { auth } from "@full-tester/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { authClient } from "@/lib/auth-client";

import Profile from "./profile";

export default async function ProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/auth/login");
  }

  const { data: customerState } = await authClient.customer.state({
    fetchOptions: {
      headers: await headers(),
    },
  });

  return (
    <div>
      <h1>Profile</h1>
      <p>Welcome {session.user.name}</p>
      <Profile session={session} customerState={customerState} />
    </div>
  );
}
