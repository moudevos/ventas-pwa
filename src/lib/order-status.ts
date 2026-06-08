import type { OrderStatus } from "./api-client";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  CREATED: "Pedido creado",
  REGISTERED: "Pedido registrado",
  PAID: "Pedido pagado",
  PRODUCTS_INCOMPLETE: "Productos incompletos",
  PRODUCTS_COMPLETE: "Productos completos",
  PAYMENT_CONFIRMED: "Pago confirmado",
  SCHEDULED: "Envio programado",
  READY_TO_SHIP: "Listo para enviar",
  PACKAGING_PAID: "Embalaje pagado",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CLOSED: "Pedido cerrado",
  OBSERVED: "Observado",
  CANCELLED: "Cancelado",
};

export const ORDER_STATUS_BADGE_CLASSES: Record<OrderStatus, string> = {
  CREATED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  REGISTERED: "bg-neutral-100 text-neutral-700 border-neutral-200",
  PAID: "bg-sky-50 text-sky-700 border-sky-200",
  PRODUCTS_INCOMPLETE: "bg-amber-50 text-amber-700 border-amber-200",
  PRODUCTS_COMPLETE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PAYMENT_CONFIRMED: "bg-sky-50 text-sky-700 border-sky-200",
  SCHEDULED: "bg-blue-50 text-blue-700 border-blue-200",
  READY_TO_SHIP: "bg-amber-50 text-amber-700 border-amber-200",
  PACKAGING_PAID: "bg-violet-50 text-violet-700 border-violet-200",
  SHIPPED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CLOSED: "bg-zinc-900 text-white border-zinc-900",
  OBSERVED: "bg-orange-50 text-orange-700 border-orange-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
};

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "CREATED",
  "PAID",
  "PRODUCTS_INCOMPLETE",
  "PRODUCTS_COMPLETE",
  "READY_TO_SHIP",
  "PACKAGING_PAID",
  "SHIPPED",
  "CLOSED",
];

export function getOrderStatusLabel(status: OrderStatus | string) {
  return ORDER_STATUS_LABELS[status as OrderStatus] ?? status;
}

export function getOrderStatusBadgeClass(status: OrderStatus | string) {
  return ORDER_STATUS_BADGE_CLASSES[status as OrderStatus] ?? "bg-neutral-100 text-neutral-700 border-neutral-200";
}
