"use client";

import { Eye, EyeOff, KeyRound } from "lucide-react";
import { useState } from "react";

import { showError, showSuccess } from "@/lib/alerts";
import { api, type UserDto } from "@/lib/api-client";

export function ChangePasswordForm() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      await api.post("/api/auth/change-password", {
        currentPassword: form.get("currentPassword"),
        newPassword: form.get("newPassword"),
      });
      const me = await api.get<UserDto>("/api/auth/me");
      if (me.mustChangePassword) {
        throw new Error("La sesion no se actualizo. Borra la cookie sales_session e inicia sesion nuevamente.");
      }
      await showSuccess("Tu contrasena fue actualizada.");
      window.location.replace("/dashboard");
    } catch (err) {
      await showError(err instanceof Error ? err.message : "No se pudo cambiar la contrasena");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={onSubmit}>
      <label className="block text-sm font-medium text-neutral-800">
        Contrasena actual
        <div className="mt-1 flex h-11 items-center rounded-md border border-neutral-300 px-3 focus-within:border-neutral-900">
          <KeyRound className="mr-2 text-neutral-400" size={18} />
          <input
            autoComplete="current-password"
            className="min-w-0 flex-1 outline-none"
            name="currentPassword"
            type={showCurrent ? "text" : "password"}
            required
          />
          <button className="text-neutral-500" onClick={() => setShowCurrent((value) => !value)} type="button">
            {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </label>
      <label className="block text-sm font-medium text-neutral-800">
        Nueva contrasena
        <div className="mt-1 flex h-11 items-center rounded-md border border-neutral-300 px-3 focus-within:border-neutral-900">
          <KeyRound className="mr-2 text-neutral-400" size={18} />
          <input
            autoComplete="new-password"
            className="min-w-0 flex-1 outline-none"
            name="newPassword"
            type={showNew ? "text" : "password"}
            required
          />
          <button className="text-neutral-500" onClick={() => setShowNew((value) => !value)} type="button">
            {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </label>
      <button className="h-11 w-full rounded-md bg-neutral-950 font-medium text-white disabled:opacity-60" disabled={pending} type="submit">
        {pending ? "Actualizando..." : "Actualizar contrasena"}
      </button>
    </form>
  );
}
