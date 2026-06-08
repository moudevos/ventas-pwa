import { redirect } from "next/navigation";
import { LogIn } from "lucide-react";

import { LoginForm } from "./login-form";
import { getSession } from "@/server/auth/session";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <main className="grid min-h-screen place-items-center bg-neutral-100 px-4">
      <section className="w-full max-w-sm rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-neutral-950 text-white">
          <LogIn size={20} />
        </div>
        <h1 className="mt-5 text-2xl font-semibold text-neutral-950">Ventas PWA</h1>
        <p className="mt-1 text-sm text-neutral-600">Ingresa con tu email y clave.</p>
        <LoginForm />
      </section>
    </main>
  );
}
