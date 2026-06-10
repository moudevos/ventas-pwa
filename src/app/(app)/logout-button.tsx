"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <button className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-slate-700 px-3 text-sm font-medium text-slate-100 hover:bg-slate-800" onClick={logout} type="button">
      Salir
    </button>
  );
}
