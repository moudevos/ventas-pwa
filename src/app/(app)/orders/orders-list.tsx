"use client";

import { ClipboardList, Eye } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/loading";
import { showError } from "@/lib/alerts";
import { api, type OrderDto, type OrderStatus } from "@/lib/api-client";
import { getOrderStatusBadgeClass, getOrderStatusLabel } from "@/lib/order-status";
import { getPusherClient } from "@/lib/pusher-client";

export function OrdersList() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status") as OrderStatus | null;
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const title = status ? `Pedidos: ${getOrderStatusLabel(status)}` : "Listado de pedidos";
  const incompleteOrders = orders.filter((order) => order.hasMissingProducts || order.status === "PRODUCTS_INCOMPLETE").slice(0, 8);
  const dueOrders = orders
    .filter((order) => order.scheduledShippingDate && !["READY_TO_SHIP", "PACKAGING_PAID", "SHIPPED", "CLOSED", "CANCELLED"].includes(order.status))
    .sort((a, b) => new Date(a.scheduledShippingDate ?? 0).getTime() - new Date(b.scheduledShippingDate ?? 0).getTime())
    .slice(0, 10);

  useEffect(() => {
    function load() {
      const query = status ? `?status=${encodeURIComponent(status)}` : "";
      api.get<OrderDto[]>(`/api/orders${query}`).then((rows) => { setOrders(rows); setNow(Date.now()); }).catch((err) => void showError(err.message));
    }
    load();
    const pusher = getPusherClient();
    const channel = pusher?.subscribe("private-orders");
    channel?.bind_global(load);
    return () => {
      channel?.unbind_global(load);
      pusher?.unsubscribe("private-orders");
    };
  }, [status]);

  return (
    <>
    <section className="mt-6 grid gap-4 lg:grid-cols-2">
      <HeaderRail title="Pedidos incompletos">
        {incompleteOrders.map((order) => (
          <Link className="min-w-56 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm" href={`/orders/${order.id}`} key={order.id}>
            <p className="font-semibold">{order.code}</p>
            <p className="text-amber-700">{getOrderStatusLabel(order.status)}</p>
          </Link>
        ))}
      </HeaderRail>
      <HeaderRail title="Pedidos por vencer">
        {dueOrders.map((order) => {
          const diff = new Date(order.scheduledShippingDate ?? 0).getTime() - now;
          return (
            <Link className={`min-w-56 rounded-lg border p-3 text-sm ${diff < 0 ? "border-rose-200 bg-rose-50" : "border-sky-200 bg-sky-50"}`} href={`/orders/${order.id}`} key={order.id}>
              <p className="font-semibold">{order.code}</p>
              <p className={diff < 0 ? "text-rose-700" : "text-sky-700"}>{order.scheduledShippingDate ? new Date(order.scheduledShippingDate).toLocaleDateString() : "Sin fecha"}</p>
            </Link>
          );
        })}
      </HeaderRail>
    </section>
    <section className="mt-6 overflow-hidden rounded-lg border border-neutral-200 bg-white">
      <div className="flex items-center gap-2 border-b border-neutral-100 p-4">
        <ClipboardList size={20} />
        <h2 className="font-semibold">{title}</h2>
        {status ? (
          <Link className="ml-auto rounded-md border px-3 py-2 text-sm hover:bg-neutral-50" href="/orders">
            Ver todos
          </Link>
        ) : null}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Codigo</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Entrega</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="px-4 py-3 font-medium">{order.code}</td>
                <td className="px-4 py-3"><span className={`rounded-full border px-2 py-1 text-xs ${getOrderStatusBadgeClass(order.status)}`}>{getOrderStatusLabel(order.status)}</span></td>
                <td className="px-4 py-3">S/ {order.totalAmount ?? order.total}</td>
                <td className="px-4 py-3">{order.shippingAddress ?? "-"}</td>
                <td className="px-4 py-3">
                  <Link className="inline-flex items-center gap-1 rounded-md border px-3 py-2 hover:bg-neutral-50" href={`/orders/${order.id}`}>
                    <Eye size={16} /> Ver
                  </Link>
                </td>
              </tr>
            ))}
            {!orders.length ? <tr><td colSpan={5}><EmptyState label="No hay pedidos registrados." /></td></tr> : null}
          </tbody>
        </table>
      </div>
    </section>
    </>
  );
}

function HeaderRail({ children, title }: { children: React.ReactNode; title: string }) {
  const count = Array.isArray(children) ? children.length : 0;
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
        {count ? children : <EmptyState label="Sin pedidos para mostrar." />}
      </div>
    </section>
  );
}
