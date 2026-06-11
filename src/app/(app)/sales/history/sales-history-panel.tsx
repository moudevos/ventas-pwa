"use client";

import { useEffect, useState } from "react";

import { EmptyState } from "@/components/loading";
import { showError } from "@/lib/alerts";
import { api } from "@/lib/api-client";

type Sale = {
  id: string;
  code: string;
  saleDate: string;
  paymentMethod: string;
  totalAmount: string;
  electronicInvoiceStatus: string;
  electronicInvoiceType?: string | null;
  source?: "STORE_SALE" | "ORDER";
};

export function SalesHistoryPanel() {
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    api.get<Sale[]>("/api/sales").then(setSales).catch((err) => void showError(err.message));
  }, []);

  return (
    <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            <th className="px-4 py-3">Codigo</th>
            <th className="px-4 py-3">Fecha</th>
            <th className="px-4 py-3">Pago</th>
            <th className="px-4 py-3">Canal</th>
            <th className="px-4 py-3">Total</th>
            <th className="px-4 py-3">Facturacion</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sales.map((sale) => (
            <tr key={sale.id}>
              <td className="px-4 py-3 font-medium">{sale.code}</td>
              <td className="px-4 py-3">{new Date(sale.saleDate).toLocaleString()}</td>
              <td className="px-4 py-3">{sale.paymentMethod}</td>
              <td className="px-4 py-3">{sale.source === "ORDER" ? "Pedido" : "Tienda"}</td>
              <td className="px-4 py-3">S/ {sale.totalAmount}</td>
              <td className="px-4 py-3">{sale.electronicInvoiceType ?? "No requerida"} - {sale.electronicInvoiceStatus}</td>
            </tr>
          ))}
          {!sales.length ? <tr><td colSpan={6}><EmptyState label="No hay ventas registradas." /></td></tr> : null}
        </tbody>
      </table>
    </section>
  );
}
