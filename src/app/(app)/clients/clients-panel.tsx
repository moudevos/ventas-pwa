"use client";

import { Building2, Mail, Phone, Search, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";

import { showError, showSuccess } from "@/lib/alerts";
import { api, type ClientDto } from "@/lib/api-client";

export function ClientsPanel() {
  const [clients, setClients] = useState<ClientDto[]>([]);
  const [query, setQuery] = useState("");

  async function load(path = "/api/clients") {
    try {
      setClients(await api.get<ClientDto[]>(path));
    } catch (err) {
      await showError(err instanceof Error ? err.message : "No se pudieron cargar clientes");
    }
  }

  useEffect(() => {
    void api
      .get<ClientDto[]>("/api/clients")
      .then(setClients)
      .catch((err) => void showError(err instanceof Error ? err.message : "No se pudieron cargar clientes"));
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api.post<ClientDto>("/api/clients/upsert", {
        name: form.get("name"),
        documentId: form.get("documentId") || undefined,
        email: form.get("email") || undefined,
        phone: form.get("phone") || undefined,
        address: form.get("address") || undefined,
      });
      event.currentTarget.reset();
      await showSuccess("Cliente guardado correctamente.");
      await load();
    } catch (err) {
      await showError(err instanceof Error ? err.message : "No se pudo guardar el cliente");
    }
  }

  async function search(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await load(query ? `/api/clients/find?q=${encodeURIComponent(query)}` : "/api/clients");
  }

  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-[380px_1fr]">
      <form className="rounded-lg border border-neutral-200 bg-white p-5" onSubmit={onSubmit}>
        <div className="flex items-center gap-2">
          <UserPlus size={20} />
          <h2 className="font-semibold">Registrar cliente</h2>
        </div>
        <div className="mt-5 space-y-3">
          <ClientField label="Nombre o razon social" name="name" required />
          <ClientField label="Documento" name="documentId" />
          <ClientField label="Email" name="email" type="email" />
          <ClientField label="Telefono" name="phone" />
          <ClientField label="Direccion" name="address" />
          <button className="h-10 w-full rounded-md bg-neutral-950 px-4 text-white" type="submit">Guardar cliente</button>
        </div>
      </form>

      <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-neutral-100 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Building2 size={20} />
            <h2 className="font-semibold">Clientes</h2>
          </div>
          <form className="flex h-10 min-w-0 rounded-md border px-3 md:w-80" onSubmit={search}>
            <Search className="mr-2 self-center text-neutral-400" size={17} />
            <input className="min-w-0 flex-1 outline-none" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar" value={query} />
          </form>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Documento</th>
                <th className="px-4 py-3 font-medium">Contacto</th>
                <th className="px-4 py-3 font-medium">Direccion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {clients.map((client) => (
                <tr key={client.id}>
                  <td className="px-4 py-3 font-medium">{client.name}</td>
                  <td className="px-4 py-3">{client.documentId ?? "-"}</td>
                  <td className="px-4 py-3">
                    <div className="space-y-1 text-neutral-600">
                      <p className="flex items-center gap-1"><Mail size={14} />{client.email ?? "-"}</p>
                      <p className="flex items-center gap-1"><Phone size={14} />{client.phone ?? "-"}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">{client.address ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function ClientField({ label, name, required, type = "text" }: { label: string; name: string; required?: boolean; type?: string }) {
  return (
    <label className="block text-sm font-medium text-slate-700">{label}
      <input className="mt-1 h-10 w-full rounded-md border px-3" name={name} required={required} type={type} />
    </label>
  );
}
