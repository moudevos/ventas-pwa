"use client";

import { ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { showError } from "@/lib/alerts";
import { api } from "@/lib/api-client";

type AuditRow = {
  id: string;
  action: string;
  entity: string;
  entityId?: string | null;
  createdAt: string;
};

export function AuditPanel() {
  const [rows, setRows] = useState<AuditRow[]>([]);

  useEffect(() => {
    api.get<AuditRow[]>("/api/audit").then(setRows).catch((err) => void showError(err.message));
  }, []);

  return (
    <section className="mt-6 overflow-hidden rounded-lg border border-neutral-200 bg-white">
      <div className="flex items-center gap-2 border-b border-neutral-100 p-4">
        <ShieldCheck size={20} />
        <h2 className="font-semibold">Eventos auditados</h2>
      </div>
      <table className="w-full text-left text-sm">
        <thead className="bg-neutral-50 text-neutral-500">
          <tr>
            <th className="px-4 py-3 font-medium">Accion</th>
            <th className="px-4 py-3 font-medium">Entidad</th>
            <th className="px-4 py-3 font-medium">ID</th>
            <th className="px-4 py-3 font-medium">Fecha</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="px-4 py-3">{row.action}</td>
              <td className="px-4 py-3">{row.entity}</td>
              <td className="px-4 py-3">{row.entityId}</td>
              <td className="px-4 py-3 text-neutral-500">{new Date(row.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
