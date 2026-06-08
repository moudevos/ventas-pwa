import "server-only";

import { count, eq } from "drizzle-orm";

import { audit } from "@/server/audit/log";
import { normalizeDocument } from "@/server/clients/documents";
import { db } from "@/server/db";
import { clients, orderItems, orders, orderStatusHistory, shipments, type OrderStatus, type UserRole } from "@/server/db/schema";
import { publishOrderEvent } from "@/server/realtime/pusher";
import { ensureProductBySku, reserveProduct } from "@/server/stock/service";
import { assertOrderTransition } from "./rules";

type OrderItemInput = {
  sku: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

function money(value: number) {
  return value.toFixed(2);
}

export async function createOrder(input: {
  actorId: string;
  clientId?: string;
  client?: {
    documentType: "DNI" | "CEX";
    documentId?: string;
    documentNumber?: string;
    firstName?: string;
    lastName?: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    deliveryAddress?: string;
    deliveryReference?: string;
    reference?: string;
    ubigeo?: string;
    department?: string;
    province?: string;
    district?: string;
    city?: string;
    notes?: string;
    observations?: string;
  };
  shippingAddress?: string;
  deliveryReference?: string;
  orderDetails: string;
  totalAmount: number;
  deliveryDate?: string;
  notes?: string;
  observations?: string;
  assignedToId?: string;
  items?: OrderItemInput[];
  request: Request;
}) {
  let clientId = input.clientId;
  if (!clientId && input.client) {
    const documentId = normalizeDocument({ documentType: input.client.documentType, documentId: input.client.documentId ?? input.client.documentNumber ?? "" });
    const [existing] = await db.select().from(clients).where(eq(clients.documentId, documentId)).limit(1);
    const clientValues = {
      documentType: input.client.documentType,
      documentId,
      firstName: input.client.firstName,
      lastName: input.client.lastName,
      name: input.client.name,
      email: input.client.email,
      phone: input.client.phone,
      address: input.client.address ?? input.client.deliveryAddress,
      deliveryReference: input.client.deliveryReference ?? input.client.reference,
      ubigeo: input.client.ubigeo,
      department: input.client.department,
      province: input.client.province,
      district: input.client.district,
      city: input.client.city,
      notes: input.client.notes ?? input.client.observations,
      createdById: input.actorId,
    };
    const [client] = existing
      ? await db.update(clients).set({ ...clientValues, updatedAt: new Date() }).where(eq(clients.id, existing.id)).returning()
      : await db.insert(clients).values(clientValues).returning();
    clientId = client.id;
    await audit({ actorId: input.actorId, action: existing ? "update" : "create", entity: "client", entityId: client.id, before: existing, after: client, request: input.request });
  }
  if (!clientId) throw new Error("Client is required");

  const [rowCount] = await db.select({ value: count() }).from(orders);
  const phone = (input.client?.phone ?? input.client?.documentId ?? "000000000").replace(/\D/g, "") || "000000000";
  const code = `${phone}-${String(rowCount.value + 1).padStart(5, "0")}`;
  const subtotal = input.items?.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) ?? input.totalAmount;
  const tax = input.items?.length ? subtotal * 0.18 : 0;
  const total = input.items?.length ? subtotal + tax : input.totalAmount;

  const [order] = await db
    .insert(orders)
    .values({
      code,
      clientId,
      status: "CREATED",
      orderDetails: input.orderDetails,
      totalAmount: money(input.totalAmount),
      totalProductsAmount: money(total),
      totalOrderAmount: money(total),
      shippingAddress: input.shippingAddress,
      deliveryReference: input.deliveryReference,
      deliveryDate: input.deliveryDate ? new Date(input.deliveryDate) : undefined,
      notes: input.notes,
      assignedToId: input.assignedToId,
      subtotal: money(subtotal),
      tax: money(tax),
      total: money(total),
      observations: input.observations,
      createdById: input.actorId,
    })
    .returning();

  let hasMissingProducts = false;
  if (input.items?.length) {
    for (const item of input.items) {
      const product = await ensureProductBySku({ sku: item.sku, description: item.description, unitPrice: item.unitPrice, actorId: input.actorId });
      const [orderItem] = await db.insert(orderItems).values({
        orderId: order.id,
        productId: product.id,
        sku: item.sku,
        description: item.description,
        quantity: item.quantity,
        unitPrice: money(item.unitPrice),
        total: money(item.quantity * item.unitPrice),
        subtotal: money(item.quantity * item.unitPrice),
      }).returning();
      const reservation = await reserveProduct({ productId: product.id, quantity: item.quantity, orderId: order.id, orderItemId: orderItem.id, actorId: input.actorId });
      hasMissingProducts ||= reservation.missingQuantity > 0;
      await db.update(orderItems).set({
        reservedQuantity: reservation.reservedQuantity,
        missingQuantity: reservation.missingQuantity,
        fulfilledQuantity: reservation.reservedQuantity,
        isComplete: reservation.missingQuantity === 0,
        updatedAt: new Date(),
      }).where(eq(orderItems.id, orderItem.id));
    }
    if (hasMissingProducts) {
      await db.update(orders).set({ hasMissingProducts: true, updatedAt: new Date() }).where(eq(orders.id, order.id));
      order.hasMissingProducts = true;
    }
  }

  await db.insert(orderStatusHistory).values({
    orderId: order.id,
    fromStatus: null,
    toStatus: order.status,
    reason: "Pedido creado",
    createdById: input.actorId,
  });
  await audit({ actorId: input.actorId, action: "create", entity: "order", entityId: order.id, after: order, request: input.request });
  await publishOrderEvent(order.id, "order.created", order);
  await publishOrderEvent(order.id, "order-created", order);
  return order;
}

export async function changeOrderStatus(input: {
  orderId: string;
  toStatus: OrderStatus;
  reason?: string;
  actorId: string;
  actorRole: UserRole;
  request: Request;
}) {
  const [before] = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);
  if (!before) throw new Error("Order not found");
  const items = await db.select({ id: orderItems.id }).from(orderItems).where(eq(orderItems.orderId, input.orderId)).limit(1);
  const [shipment] = await db.select().from(shipments).where(eq(shipments.orderId, input.orderId)).limit(1);
  assertOrderTransition({
    from: before.status,
    to: input.toStatus,
    role: input.actorRole,
    hasItems: items.length > 0,
    packagingPaymentConfirmed: before.packagingPaymentConfirmed,
    productPaymentConfirmed: before.productPaymentConfirmed,
    hasMissingProducts: before.hasMissingProducts,
    scheduledShippingAt: before.scheduledShippingDate ?? before.scheduledShippingAt,
    packagedAt: before.packagedAt,
    shippingProviderName: before.providerName ?? before.shippingProviderName ?? shipment?.carrier,
    deliveredAt: shipment?.deliveredAt ?? null,
    customerReceivedConfirmed: before.customerReceivedConfirmed,
    carrierDeliveredConfirmed: before.carrierDeliveredConfirmed,
  });

  const [after] = await db
    .update(orders)
    .set({ status: input.toStatus, updatedAt: new Date() })
    .where(eq(orders.id, input.orderId))
    .returning();

  await db.insert(orderStatusHistory).values({
    orderId: input.orderId,
    fromStatus: before.status,
    toStatus: after.status,
    reason: input.reason,
    createdById: input.actorId,
  });
  await audit({
    actorId: input.actorId,
    action: "status_transition",
    entity: "order",
    entityId: input.orderId,
    before,
    after: { ...after, reason: input.reason },
    request: input.request,
  });
  await publishOrderEvent(input.orderId, "order-status-changed", { orderId: input.orderId, from: before.status, to: after.status });
  await publishOrderEvent(input.orderId, "order.statusChanged", { orderId: input.orderId, from: before.status, to: after.status });
  return after;
}

export async function upsertShipment(input: {
  orderId: string;
  actorId: string;
  providerType?: "MOTORIZED" | "COURIER";
  providerName?: string;
  carrier?: string;
  trackingNumber?: string;
  scheduledAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  notes?: string;
  request: Request;
}) {
  const values = {
    orderId: input.orderId,
    carrier: input.carrier,
    trackingNumber: input.trackingNumber,
    scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
    shippedAt: input.shippedAt ? new Date(input.shippedAt) : undefined,
    deliveredAt: input.deliveredAt ? new Date(input.deliveredAt) : undefined,
    notes: input.notes,
    createdById: input.actorId,
    updatedAt: new Date(),
  };
  await db
    .update(orders)
    .set({
      shippingProviderType: input.providerType,
      shippingProviderName: input.providerName ?? input.carrier,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, input.orderId));
  const [shipment] = await db
    .insert(shipments)
    .values(values)
    .onConflictDoUpdate({ target: shipments.orderId, set: values })
    .returning();
  await audit({ actorId: input.actorId, action: "update", entity: "shipment", entityId: shipment.id, after: shipment, request: input.request });
  await publishOrderEvent(input.orderId, "order-shipment-updated", { orderId: input.orderId, shipment });
  await publishOrderEvent(input.orderId, "order.shipmentRegistered", { orderId: input.orderId, shipment });
  return shipment;
}
