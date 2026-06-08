"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { EmptyState, PageLoader } from "@/components/loading";
import { showError, showToast } from "@/lib/alerts";
import { type OrderDto } from "@/lib/api-client";
import { getOrderStatusBadgeClass, getOrderStatusLabel, ORDER_STATUS_FLOW } from "@/lib/order-status";
import { getPusherClient } from "@/lib/pusher-client";

type DashboardSummary = {
  total: number;
  byStatus: Record<string, number>;
  registered: number;
  created: number;
  paid: number;
  productsIncomplete: number;
  productsComplete: number;
  scheduled: number;
  readyToShip: number;
  shipped: number;
  delivered: number;
  closed: number;
  observed: number;
  cancelled: number;
  salesToday: number;
  salesWeek: number;
  storeSalesToday: number;
  storeSalesWeek: number;
  storeSalesTotal: number;
  salesByChannel: { ORDER: number; STORE_SALE: number };
  paidOrdersCount: number;
  averageTicket: number;
  totalProductsAmount: number;
  overdue: OrderDto[];
  dueSoon: OrderDto[];
  orders: OrderDto[];
  incompleteOrders: OrderDto[];
  missingItems: Array<{ id: string; sku?: string | null; description: string; missingQuantity: number; orderId: string }>;
  lowStock: Array<{ id: string; sku: string; description: string; stockOnHand: number; stockReserved: number; stockAvailable: number; minStock: number }>;
  latestKardex: Array<{ id: string; movementType: string; quantity: number; sourceType?: string | null; createdAt: string }>;
};

export function DashboardPanel() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [alertTab, setAlertTab] = useState<"stock" | "production" | "shipping">("stock");

  async function load(silent = false) {
    const response = await fetch("/api/dashboard/summary", { credentials: "include" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error?.message ?? "No se pudo cargar dashboard");
    setSummary(payload.data);
    setNow(Date.now());
    if (!silent) await showToast("Dashboard actualizado", "info");
  }

  useEffect(() => {
    fetch("/api/dashboard/summary", { credentials: "include" })
      .then((response) => response.json().then((payload) => ({ response, payload })))
      .then(({ response, payload }) => {
        if (!response.ok) throw new Error(payload.error?.message ?? "No se pudo cargar dashboard");
        setSummary(payload.data);
      })
      .catch((err) => void showError(err.message));
    const interval = window.setInterval(() => load(true).catch(() => undefined), 30000);
    const pusher = getPusherClient();
    const channel = pusher?.subscribe("private-orders");
    channel?.bind_global(() => load(true).catch(() => undefined));
    return () => {
      window.clearInterval(interval);
      channel?.unbind_global();
      pusher?.unsubscribe("private-orders");
    };
  }, []);

  if (!summary) return <PageLoader label="Cargando dashboard..." />;

  return (
    <section>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <Link className="inline-flex h-10 items-center gap-2 rounded-md bg-neutral-950 px-4 text-white" href="/orders/new">
          <Plus size={17} /> Crear orden
        </Link>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <details className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" open>
            <summary className="cursor-pointer font-semibold text-slate-900">Panel Ventas</summary>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <MetricCard label="Ventas hoy" value={money(summary.salesToday)} tone="emerald" />
              <MetricCard label="Ventas semana" value={money(summary.salesWeek)} tone="indigo" />
              <MetricCard label="Tienda hoy" value={money(summary.storeSalesToday)} href="/sales/history" tone="emerald" />
              <MetricCard label="Tienda semana" value={money(summary.storeSalesWeek)} href="/sales/history" tone="sky" />
              <MetricCard label="Pedidos pagados" value={summary.paidOrdersCount} tone="sky" />
              <MetricCard label="Ticket promedio" value={money(summary.averageTicket)} tone="violet" />
            </div>
          </details>

          <details className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" open>
            <summary className="cursor-pointer font-semibold text-slate-900">Panel Pedidos</summary>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {[
                { href: "/orders", label: "Total pedidos", value: summary.total, tone: "slate" },
                { href: "/orders?status=CREATED", label: "Creados", value: summary.created, tone: "indigo" },
                { href: "/orders?status=PAID", label: "Pagados", value: summary.paid, tone: "sky" },
                { href: "/orders?status=PRODUCTS_INCOMPLETE", label: "Incompletos", value: summary.productsIncomplete, tone: "amber" },
                { href: "/orders?status=PRODUCTS_COMPLETE", label: "Productos completos", value: summary.productsComplete, tone: "emerald" },
                { href: "/orders?status=READY_TO_SHIP", label: "Listos para enviar", value: summary.readyToShip, tone: "amber" },
                { href: "/orders?status=PACKAGING_PAID", label: "Embalaje pagado", value: summary.byStatus.PACKAGING_PAID ?? 0, tone: "violet" },
                { href: "/orders?status=SHIPPED", label: "Enviados", value: summary.shipped, tone: "violet" },
                { href: "/orders?status=CLOSED", label: "Cerrados", value: summary.closed, tone: "emerald" },
              ].map((item) => <MetricCard {...item} key={item.label} />)}
            </div>
          </details>
        </div>

        <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Alertas</h2>
          <div className="mt-3 grid grid-cols-3 rounded-lg bg-slate-100 p-1 text-xs">
            <TabButton active={alertTab === "stock"} label="Stock" onClick={() => setAlertTab("stock")} />
            <TabButton active={alertTab === "production"} label="Confeccion" onClick={() => setAlertTab("production")} />
            <TabButton active={alertTab === "shipping"} label="Envios" onClick={() => setAlertTab("shipping")} />
          </div>
          <div className="mt-4 grid max-h-[560px] gap-2 overflow-y-auto">
            {alertTab === "stock" ? summary.lowStock.map((product) => (
              <div className="rounded-md border border-rose-100 bg-rose-50/60 p-3 text-sm" key={product.id}>
                <p className="font-medium">{product.sku}</p>
                <p className="text-rose-700">Fisico {product.stockOnHand} / Reservado {product.stockReserved} / Disponible {product.stockAvailable} / Min {product.minStock}</p>
              </div>
            )) : null}
            {alertTab === "production" ? summary.missingItems.map((item) => (
              <div className="rounded-md border border-sky-100 bg-sky-50/60 p-3 text-sm" key={item.id}>
                <p className="font-medium">{item.sku ?? "Sin SKU"} - {item.description}</p>
                <p className="text-sky-700">Faltan {item.missingQuantity}</p>
              </div>
            )) : null}
            {alertTab === "shipping" ? [...summary.overdue, ...summary.dueSoon].map((order) => (
              <Link className="rounded-md border border-amber-100 bg-amber-50/60 p-3 text-sm" href={`/orders/${order.id}`} key={order.id}>
                <p className="font-medium">{order.code}</p>
                <p className="text-amber-700">{order.scheduledShippingDate ? new Date(order.scheduledShippingDate).toLocaleDateString() : "Sin fecha"} - {getOrderStatusLabel(order.status)}</p>
              </Link>
            )) : null}
            {alertTab === "stock" && !summary.lowStock.length ? <EmptyState label="Sin stock bajo." /> : null}
            {alertTab === "production" && !summary.missingItems.length ? <EmptyState label="Sin confeccion pendiente." /> : null}
            {alertTab === "shipping" && !summary.overdue.length && !summary.dueSoon.length ? <EmptyState label="Sin envios vencidos o proximos." /> : null}
          </div>
        </aside>
      </div>

      <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="font-semibold">Proximos envios</h2>
        <div className="mt-4 grid gap-2">
          {[...summary.overdue, ...summary.dueSoon].sort((a, b) => new Date(a.scheduledShippingDate ?? 0).getTime() - new Date(b.scheduledShippingDate ?? 0).getTime()).map((order) => (
            <Link className="flex items-center justify-between rounded-md border border-neutral-200 p-3 hover:bg-neutral-50" href={`/orders/${order.id}`} key={order.id}>
              <span>
                <span className="block font-medium">{order.code}</span>
                <span className="text-xs text-neutral-500">{order.scheduledShippingDate ? new Date(order.scheduledShippingDate).toLocaleDateString() : "Sin fecha"}</span>
              </span>
              <span className="flex items-center gap-2">
                <ShippingSignal date={order.scheduledShippingDate} now={now} />
                <span className={`rounded-full border px-2 py-1 text-xs ${getOrderStatusBadgeClass(order.status)}`}>{getOrderStatusLabel(order.status)}</span>
              </span>
            </Link>
          ))}
          {!summary.overdue.length && !summary.dueSoon.length ? <EmptyState label="No hay envios proximos o vencidos." /> : null}
        </div>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-3">
        {ORDER_STATUS_FLOW.map((status) => (
          <article className="rounded-lg border border-neutral-200 bg-white p-4" key={status}>
            <h3 className="font-semibold">{getOrderStatusLabel(status)}</h3>
            <div className="mt-3 grid gap-2">
              {summary.orders.filter((order) => order.status === status).map((order) => (
                <Link className="rounded-md border border-neutral-100 p-3 text-sm hover:bg-neutral-50" href={`/orders/${order.id}`} key={order.id}>
                  <p className="font-medium">{order.code}</p>
                  <p className="text-neutral-500">S/ {order.totalAmount ?? order.total}</p>
                </Link>
              ))}
            </div>
          </article>
        ))}
      </section>
    </section>
  );
}

function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button className={`rounded-md px-2 py-2 font-medium ${active ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500"}`} onClick={onClick} type="button">
      {label}
    </button>
  );
}

function money(value: number) {
  return `S/ ${value.toFixed(2)}`;
}

function MetricCard({ href, label, tone = "slate", value }: { href?: string; label: string; tone?: string; value: number | string }) {
  const classes: Record<string, string> = {
    amber: "border-amber-100 bg-amber-50/70 text-amber-800",
    emerald: "border-emerald-100 bg-emerald-50/70 text-emerald-800",
    indigo: "border-indigo-100 bg-indigo-50/70 text-indigo-800",
    rose: "border-rose-100 bg-rose-50/70 text-rose-800",
    sky: "border-sky-100 bg-sky-50/70 text-sky-800",
    slate: "border-slate-100 bg-slate-50 text-slate-800",
    violet: "border-violet-100 bg-violet-50/70 text-violet-800",
  };
  const content = (
    <>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </>
  );
  const className = `rounded-xl border p-5 transition ${classes[tone] ?? classes.slate}`;
  return href ? <Link className={`${className} hover:shadow-sm`} href={href}>{content}</Link> : <article className={className}>{content}</article>;
}

function ShippingSignal({ date, now }: { date?: string | null; now: number }) {
  if (!date) return <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">sin fecha</span>;
  const target = new Date(date).getTime();
  const diff = target - now;
  if (diff < 0) return <span className="rounded-full bg-rose-100 px-2 py-1 text-xs text-rose-700">vencido</span>;
  if (new Date(date).toDateString() === new Date(now).toDateString()) return <span className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-700">hoy</span>;
  if (diff <= 24 * 60 * 60 * 1000) return <span className="rounded-full bg-sky-100 px-2 py-1 text-xs text-sky-700">24h</span>;
  return <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">programado</span>;
}
