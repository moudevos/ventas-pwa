"use client";

import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { showError } from "@/lib/alerts";

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    setPending(false);
    if (!response.ok) {
      await showError("Credenciales invalidas.");
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={onSubmit}>
      <label className="block text-sm font-medium text-neutral-800">
        Email
        <div className="mt-1 flex h-11 items-center rounded-md border border-neutral-300 px-3 focus-within:border-neutral-900">
          <Mail className="mr-2 text-neutral-400" size={18} />
          <input className="min-w-0 flex-1 outline-none" name="email" type="email" autoComplete="email" required />
        </div>
      </label>
      <label className="block text-sm font-medium text-neutral-800">
        Password
        <div className="mt-1 flex h-11 items-center rounded-md border border-neutral-300 px-3 focus-within:border-neutral-900">
          <LockKeyhole className="mr-2 text-neutral-400" size={18} />
          <input
            className="min-w-0 flex-1 outline-none"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
          />
          <button className="text-neutral-500" onClick={() => setShowPassword((value) => !value)} type="button">
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </label>
      <button className="h-11 w-full rounded-md bg-neutral-950 px-4 font-medium text-white disabled:opacity-60" disabled={pending} type="submit">
        {pending ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}
