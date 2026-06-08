"use client";

import { Download, Printer, Search } from "lucide-react";
import { useEffect, useState } from "react";

import { EmptyState, PageLoader } from "@/components/loading";
import { showError } from "@/lib/alerts";
import { api } from "@/lib/api-client";

type Movement = {
  id: string;
  createdAt: string;
  sku?: string | null;
  productDescription?: string | null;
  movementType: string;
  quantity: number;
  previousStockOnHand: number;
  newStockOnHand: number;
  previousStockReserved: number;
  newStockReserved: number;
  sourceType?: string | null;
  orderCode?: string | null;
  saleCode?: string | null;
  actorName?: string | null;
  reason?: string | null;
};

export function KardexPanel() {
  const [rows, setRows] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailModal, setDetailModal] = useState<Movement | null>(null);
  const [filters, setFilters] = useState({ movementType: "", q: "", sourceType: "", dateFrom: "", dateTo: "" });

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.movementType) params.set("movementType", filters.movementType);
      if (filters.sourceType) params.set("sourceType", filters.sourceType);
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);
      setRows(await api.get<Movement[]>(`/api/kardex${params.size ? `?${params.toString()}` : ""}`));
    } catch (err) {
      await showError(err instanceof Error ? err.message : "No se pudo cargar kardex");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    api.get<Movement[]>("/api/kardex")
      .then(setRows)
      .catch((err) => void showError(err instanceof Error ? err.message : "No se pudo cargar kardex"))
      .finally(() => setLoading(false));
  }, []);

  const visible = filters.q ? rows.filter((row) => `${row.sku ?? ""} ${row.productDescription ?? ""}`.toLowerCase().includes(filters.q.toLowerCase())) : rows;

  function exportCsv() {
    const header = ["fecha", "sku", "producto", "tipo", "cantidad", "stock_anterior", "stock_nuevo", "reservado_anterior", "reservado_nuevo", "origen", "codigo", "usuario", "motivo"];
    const csv = [header, ...visible.map((row) => [
      new Date(row.createdAt).toLocaleString(),
      row.sku ?? "",
      row.productDescription ?? "",
      row.movementType,
      row.quantity,
      row.previousStockOnHand,
      row.newStockOnHand,
      row.previousStockReserved,
      row.newStockReserved,
      row.sourceType ?? "",
      row.orderCode ?? row.saleCode ?? "",
      row.actorName ?? "",
      row.reason ?? "",
    ])].map((line) => line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "kardex.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="mt-6 w-full bg-white">
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-3 border-b border-slate-100 p-4 lg:grid-cols-[1fr_180px_180px_150px_150px_auto]">
          <label className="text-sm font-medium">Producto / SKU
            <input className="mt-1 h-10 w-full rounded-md border px-3" value={filters.q} onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))} />
          </label>
          <label className="text-sm font-medium">Movimiento
            <select className="mt-1 h-10 w-full rounded-md border px-3" value={filters.movementType} onChange={(event) => setFilters((current) => ({ ...current, movementType: event.target.value }))}>
              <option value="">Todos</option>
              {["IN", "RESERVE", "RELEASE", "OUT", "ADJUSTMENT", "PENDING_PRODUCTION"].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">Origen
            <select className="mt-1 h-10 w-full rounded-md border px-3" value={filters.sourceType} onChange={(event) => setFilters((current) => ({ ...current, sourceType: event.target.value }))}>
              <option value="">Todos</option>
              {["ORDER", "STORE_SALE", "MANUAL", "PRODUCTION"].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">Desde
            <input className="mt-1 h-10 w-full rounded-md border px-3" type="date" value={filters.dateFrom} onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value }))} />
          </label>
          <label className="text-sm font-medium">Hasta
            <input className="mt-1 h-10 w-full rounded-md border px-3" type="date" value={filters.dateTo} onChange={(event) => setFilters((current) => ({ ...current, dateTo: event.target.value }))} />
          </label>
          <div className="flex items-end gap-2">
            <button className="inline-flex h-10 items-center gap-2 rounded-md bg-indigo-600 px-3 text-white" onClick={() => void load()} type="button"><Search size={16} /> Filtrar</button>
            <button className="h-10 rounded-md border px-3" onClick={exportCsv} type="button"><Download size={16} /></button>
            <button className="h-10 rounded-md border px-3" onClick={() => window.print()} type="button"><Printer size={16} /></button>
          </div>
        </div>
        {loading ? <PageLoader label="Cargando kardex..." /> : (
          <div className="overflow-x-auto px-4 py-6">
            <table className="min-w-full text-left text-sm table-fixed">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 w-[170px]">Fecha</th>
                  <th className="px-4 py-3 w-[360px]">Producto</th>
                  <th className="px-4 py-3 w-[90px]">Cant.</th>
                  <th className="px-4 py-3 w-[160px]">Fisico</th>
                  <th className="px-4 py-3 w-[160px]">Reservado</th>
                  <th className="px-4 py-3 w-[120px]">Origen</th>
                  <th className="px-4 py-3 w-[120px]">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((row) => {
                  const isIn = row.movementType === "IN";
                  const isOut = row.movementType === "OUT";
                  return (
                    <tr key={row.id} className="align-top">
                      <td className="px-4 py-3 align-top text-xs text-slate-600">{new Date(row.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-3 align-top">
                        <span className="font-medium">{row.sku}</span>
                        <div className="text-xs text-slate-500 mt-1">{row.productDescription}</div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        {isIn ? (
                          <span className="text-green-600 font-semibold">+{row.quantity}</span>
                        ) : isOut ? (
                          <span className="text-red-600 font-semibold">-{row.quantity}</span>
                        ) : (
                          <span className="text-slate-700">{row.quantity}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top text-xs text-slate-600">{row.previousStockOnHand} <span className="mx-1">→</span> {row.newStockOnHand}</td>
                      <td className="px-4 py-3 align-top text-xs text-slate-600">{row.previousStockReserved} <span className="mx-1">→</span> {row.newStockReserved}</td>
                      <td className="px-4 py-3 align-top text-sm">{row.sourceType ?? "-"}</td>
                      <td className="px-4 py-3 align-top text-sm">
                        <button className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm" onClick={() => setDetailModal(row)} type="button">Ver detalles</button>
                      </td>
                    </tr>
                  );
                })}
                {!visible.length ? <tr><td colSpan={10}><EmptyState label="No hay movimientos." /></td></tr> : null}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {detailModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-semibold">Detalle movimiento</h2>
              <button className="text-slate-500" onClick={() => setDetailModal(null)} aria-label="Cerrar">✕</button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-slate-700">
              <div><strong>Fecha:</strong><div className="text-xs text-slate-600 mt-1">{new Date(detailModal.createdAt).toLocaleString()}</div></div>
              <div><strong>SKU:</strong><div className="text-xs text-slate-600 mt-1">{detailModal.sku}</div></div>
              <div className="col-span-2"><strong>Producto:</strong><div className="text-xs text-slate-600 mt-1">{detailModal.productDescription}</div></div>
              <div><strong>Movimiento:</strong><div className="text-xs text-slate-600 mt-1">{detailModal.movementType}</div></div>
              <div><strong>Cantidad:</strong><div className="text-xs text-slate-600 mt-1">{detailModal.quantity}</div></div>
              <div><strong>Stock anterior:</strong><div className="text-xs text-slate-600 mt-1">{detailModal.previousStockOnHand}</div></div>
              <div><strong>Stock nuevo:</strong><div className="text-xs text-slate-600 mt-1">{detailModal.newStockOnHand}</div></div>
              <div><strong>Reservado anterior:</strong><div className="text-xs text-slate-600 mt-1">{detailModal.previousStockReserved}</div></div>
              <div><strong>Reservado nuevo:</strong><div className="text-xs text-slate-600 mt-1">{detailModal.newStockReserved}</div></div>
              <div><strong>Origen:</strong><div className="text-xs text-slate-600 mt-1">{detailModal.sourceType ?? "-"}</div></div>
              <div><strong>Código:</strong><div className="text-xs text-slate-600 mt-1">{detailModal.orderCode ?? detailModal.saleCode ?? "-"}</div></div>
              <div><strong>Usuario:</strong><div className="text-xs text-slate-600 mt-1">{detailModal.actorName ?? "-"}</div></div>
              <div className="col-span-2"><strong>Motivo:</strong><div className="text-xs text-slate-600 mt-1">{detailModal.reason ?? "-"}</div></div>
            </div>
            <div className="mt-5 flex justify-end">
              <button className="h-10 rounded-md border px-4" onClick={() => setDetailModal(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
