"use client";

import { Truck } from "lucide-react";
import { useEffect, useState } from "react";

import { showError, showSuccess } from "@/lib/alerts";
import { api, type OrderDto } from "@/lib/api-client";

export function ShippingPanel() {
  const [orders, setOrders] = useState<OrderDto[]>([]);

  useEffect(() => {
    api.get<OrderDto[]>("/api/orders").then(setOrders).catch((err) => void showError(err.message));
  }, []);

  async function save(orderId: string, form: HTMLFormElement) {
    const data = new FormData(form);
    try {
      await api.post(`/api/orders/${orderId}/shipment`, {
        carrier: data.get("carrier") || undefined,
        trackingNumber: data.get("trackingNumber") || undefined,
        notes: data.get("notes") || undefined,
      });
      form.reset();
      await showSuccess("Envio actualizado.");
    } catch (err) {
      await showError(err instanceof Error ? err.message : "No se pudo guardar el envio");
    }
  }

  return (
    <div className="mt-6 grid gap-4">
      <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white p-4">
        <Truck size={20} />
        <p className="font-semibold">Pedidos listos para gestion de envio</p>
      </div>
      {orders.filter((order) => ["SCHEDULED", "READY_TO_SHIP", "SHIPPED"].includes(order.status)).map((order) => (
        <form className="grid gap-3 rounded-lg border border-neutral-200 bg-white p-4 md:grid-cols-5" key={order.id} onSubmit={(event) => { event.preventDefault(); void save(order.id, event.currentTarget); }}>
          <div>
            <p className="font-medium">{order.code}</p>
            <p className="text-sm text-neutral-500">{order.status}</p>
          </div>
          <input className="h-10 rounded-md border px-3" name="carrier" placeholder="Courier" />
          <input className="h-10 rounded-md border px-3" name="trackingNumber" placeholder="Tracking" />
          <input className="h-10 rounded-md border px-3" name="notes" placeholder="Notas" />
          <button className="h-10 rounded-md bg-neutral-950 px-4 text-white" type="submit">Guardar envio</button>
        </form>
      ))}
      {!orders.filter((order) => ["SCHEDULED", "READY_TO_SHIP", "SHIPPED"].includes(order.status)).length ? (
        <p className="rounded-lg border border-neutral-200 bg-white p-4 text-sm text-neutral-500">No hay pedidos en etapa de envio.</p>
      ) : null}
    </div>
  );
}
