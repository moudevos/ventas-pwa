"use client";

import { useEffect, useState } from "react";

import { EmptyState, PageLoader } from "@/components/loading";
import { showError } from "@/lib/alerts";
import { api } from "@/lib/api-client";

type Sale = {
  id: string;
  code: string;
  saleDate: string;
  paymentMethod: string;
  totalAmount: string;
  electronicInvoiceStatus: string;
};

type SalesSummary = {
  total: number;
  today: number;
  week: number;
  count: number;
  latest: Sale[];
};

export function SalesDashboardPanel() {
  const [summary, setSummary] = useState<SalesSummary | null>(null);

  useEffect(() => {
    api.get<SalesSummary>("/api/sales/summary").then(setSummary).catch((err) => void showError(err.message));
  }, []);

  if (!summary) return <PageLoader label="Cargando ventas..." />;

  return (
    <div className="mt-6 space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <SalesCard label="Ventas hoy" value={money(summary.today)} tone="emerald" />
        <SalesCard label="Ventas semana" value={money(summary.week)} tone="indigo" />
        <SalesCard label="Total vendido" value={money(summary.total)} tone="sky" />
        <SalesCard label="Cantidad ventas" value={summary.count} tone="amber" />
        <SalesCard label="Ticket promedio" value={money(summary.count ? summary.total / summary.count : 0)} tone="violet" />
        <SalesCard label="Canal tienda" value={money(summary.total)} tone="slate" />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold">Filtros de analisis</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <label className="text-sm font-medium">Desde<input className="mt-1 h-10 w-full rounded-md border px-3" type="date" /></label>
          <label className="text-sm font-medium">Hasta<input className="mt-1 h-10 w-full rounded-md border px-3" type="date" /></label>
          <label className="text-sm font-medium">Metodo<select className="mt-1 h-10 w-full rounded-md border px-3"><option>Todos</option><option>YAPE</option><option>PLIN</option><option>TARJETA</option><option>EFECTIVO</option></select></label>
          <label className="text-sm font-medium">Facturacion<select className="mt-1 h-10 w-full rounded-md border px-3"><option>Todos</option><option>NOT_REQUIRED</option><option>READY</option><option>PENDING</option></select></label>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4">
          <h2 className="font-semibold">Ultimas ventas</h2>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr><th className="px-4 py-3">Codigo</th><th>Fecha</th><th>Metodo</th><th>Total</th><th>Facturacion</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {summary.latest.map((sale) => (
              <tr key={sale.id}>
                <td className="px-4 py-3 font-medium">{sale.code}</td>
                <td>{new Date(sale.saleDate).toLocaleString()}</td>
                <td>{sale.paymentMethod}</td>
                <td>S/ {sale.totalAmount}</td>
                <td>{sale.electronicInvoiceStatus}</td>
              </tr>
            ))}
            {!summary.latest.length ? <tr><td colSpan={5}><EmptyState label="No hay ventas." /></td></tr> : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function money(value: number) {
  return `S/ ${value.toFixed(2)}`;
}

function SalesCard({ label, tone, value }: { label: string; tone: string; value: string | number }) {
  const tones: Record<string, string> = {
    amber: "border-amber-100 bg-amber-50 text-amber-800",
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-800",
    indigo: "border-indigo-100 bg-indigo-50 text-indigo-800",
    sky: "border-sky-100 bg-sky-50 text-sky-800",
    slate: "border-slate-100 bg-slate-50 text-slate-800",
    violet: "border-violet-100 bg-violet-50 text-violet-800",
  };
  return (
    <article className={`rounded-xl border p-5 shadow-sm ${tones[tone] ?? tones.slate}`}>
      <p className="text-sm opacity-80">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </article>
  );
}
