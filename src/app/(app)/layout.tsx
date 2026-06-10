import { redirect } from "next/navigation";

import { getSession } from "@/server/auth/session";
import { AppShell } from "./app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return <AppShell email={session.email} role={session.role}>{children}</AppShell>;
}
