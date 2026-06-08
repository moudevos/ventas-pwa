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
    <button className="rounded-md border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-100" onClick={logout} type="button">
      Salir
    </button>
  );
}
