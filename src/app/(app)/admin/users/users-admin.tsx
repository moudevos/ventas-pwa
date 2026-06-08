"use client";

import { Eye, KeyRound, Mail, Plus, Shield, UserPlus, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { showError, showSuccess } from "@/lib/alerts";
import { api, type UserDto } from "@/lib/api-client";

type UserRow = UserDto & {
  phone?: string | null;
  status?: "active" | "inactive";
  temporaryPasswordVisible?: string | null;
};

export function UsersAdmin() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [resetUser, setResetUser] = useState<UserRow | null>(null);
  const [pending, setPending] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setUsers(await api.get<UserRow[]>("/api/admin/users"));
    } catch (err) {
      await showError(err instanceof Error ? err.message : "No se pudieron cargar usuarios");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void api
      .get<UserRow[]>("/api/admin/users")
      .then(setUsers)
      .catch((err) => void showError(err instanceof Error ? err.message : "No se pudieron cargar usuarios"))
      .finally(() => setLoading(false));
  }, []);

  async function createUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      await api.post("/api/admin/users", {
        name: form.get("name"),
        email: form.get("email"),
        phone: form.get("phone") || undefined,
        temporaryPassword: form.get("temporaryPassword"),
        role: form.get("role"),
        status: form.get("status"),
        mustChangePassword: true,
      });
      await showSuccess("Usuario creado correctamente.");
      setShowCreate(false);
      await load();
    } catch (err) {
      await showError(err instanceof Error ? err.message : "No se pudo crear usuario");
    } finally {
      setPending(false);
    }
  }

  async function resetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resetUser) return;
    setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      await api.post(`/api/admin/users/${resetUser.id}/reset-password`, {
        temporaryPassword: form.get("temporaryPassword"),
      });
      await showSuccess("Password temporal actualizado.");
      setResetUser(null);
      await load();
    } catch (err) {
      await showError(err instanceof Error ? err.message : "No se pudo resetear password");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-6">
      <div className="mb-4 flex justify-end">
        <button className="inline-flex h-10 items-center gap-2 rounded-md bg-neutral-950 px-4 text-white" onClick={() => setShowCreate(true)} type="button">
          <Plus size={17} /> Crear usuario
        </button>
      </div>
      <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <div className="flex items-center gap-2 border-b border-neutral-100 p-4">
          <Users size={20} />
          <h2 className="font-semibold">Usuarios</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Telefono</th>
                <th className="px-4 py-3 font-medium">Rol</th>
                <th className="px-4 py-3 font-medium">Temporal</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3 font-medium">{user.name}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">{user.phone ?? "-"}</td>
                  <td className="px-4 py-3 capitalize">{user.role}</td>
                  <td className="px-4 py-3">{user.mustChangePassword ? user.temporaryPasswordVisible ?? "Pendiente" : "No visible"}</td>
                  <td className="px-4 py-3">
                    <button className="inline-flex items-center gap-1 rounded-md border px-3 py-2 hover:bg-neutral-50" onClick={() => setResetUser(user)} type="button">
                      <KeyRound size={15} /> Reset
                    </button>
                  </td>
                </tr>
              ))}
              {!users.length && !loading ? <tr><td className="px-4 py-6 text-neutral-500" colSpan={6}>No hay usuarios.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>

      {showCreate ? (
        <Modal title="Crear usuario" onClose={() => setShowCreate(false)}>
          <form className="space-y-3" onSubmit={createUser}>
            <Input icon={<UserPlus size={17} />} name="name" placeholder="Nombre" required />
            <Input icon={<Mail size={17} />} name="email" placeholder="Email" required type="email" />
            <Input name="phone" placeholder="Telefono" />
            <Input icon={<Eye size={17} />} name="temporaryPassword" placeholder="Password temporal" required />
            <div className="flex h-10 items-center rounded-md border px-3">
              <Shield className="mr-2 text-neutral-400" size={17} />
              <select className="min-w-0 flex-1 bg-transparent outline-none" name="role">
                <option value="promoter">Promoter</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <select className="h-10 w-full rounded-md border px-3" name="status" defaultValue="active">
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
            <button className="h-10 w-full rounded-md bg-neutral-950 text-white disabled:opacity-60" disabled={pending} type="submit">
              {pending ? "Creando..." : "Crear"}
            </button>
          </form>
        </Modal>
      ) : null}

      {resetUser ? (
        <Modal title={`Resetear password: ${resetUser.name}`} onClose={() => setResetUser(null)}>
          <form className="space-y-3" onSubmit={resetPassword}>
            <Input icon={<KeyRound size={17} />} name="temporaryPassword" placeholder="Nuevo password temporal" required />
            <button className="h-10 w-full rounded-md bg-neutral-950 text-white disabled:opacity-60" disabled={pending} type="submit">
              {pending ? "Reseteando..." : "Resetear"}
            </button>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <section className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">{title}</h2>
          <button className="rounded-md border px-2 py-1" onClick={onClose} type="button">Cerrar</button>
        </div>
        {children}
      </section>
    </div>
  );
}

function Input({ icon, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode }) {
  return (
    <div className="flex h-10 items-center rounded-md border px-3">
      {icon ? <span className="mr-2 text-neutral-400">{icon}</span> : null}
      <input className="min-w-0 flex-1 outline-none" {...props} />
    </div>
  );
}
