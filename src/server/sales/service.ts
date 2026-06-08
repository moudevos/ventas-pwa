import "server-only";

import { count, eq } from "drizzle-orm";

import { audit } from "@/server/audit/log";
import { normalizeDocument } from "@/server/clients/documents";
import { db } from "@/server/db";
import { clients, products, saleItems, sales } from "@/server/db/schema";
import { publishOrderEvent } from "@/server/realtime/pusher";
import { recordStockMovement } from "@/server/stock/service";

function money(value: number) {
  return value.toFixed(2);
}

async function getOrCreateClient(input: {
  actorId: string;
  client?: {
    documentType?: "DNI" | "CEX";
    documentId?: string;
    documentNumber?: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  request: Request;
}) {
  if (!input.client?.documentNumber && !input.client?.phone && !input.client?.name) {
    const [generic] = await db.select().from(clients).where(eq(clients.documentId, "00000000")).limit(1);
    if (generic) return generic;
    const [client] = await db.insert(clients).values({
      documentType: "GENERIC",
      documentId: "00000000",
      firstName: "Cliente",
      lastName: "Generico",
      name: "Cliente Generico",
      createdById: input.actorId,
    }).returning();
    await audit({ actorId: input.actorId, action: "create", entity: "client", entityId: client.id, after: client, request: input.request });
    return client;
  }

  const documentId = input.client.documentNumber
    ? normalizeDocument({ documentType: input.client.documentType ?? "DNI", documentId: input.client.documentNumber })
    : input.client.phone?.replace(/\D/g, "");
  if (!documentId) throw new Error("Client document or phone is required");
  const [existing] = await db.select().from(clients).where(eq(clients.documentId, documentId)).limit(1);
  const values = {
    documentType: input.client.documentType ?? "DNI",
    documentId,
    firstName: input.client.firstName,
    lastName: input.client.lastName,
    name: input.client.name ?? (`${input.client.firstName ?? ""} ${input.client.lastName ?? ""}`.trim() || documentId),
    email: input.client.email,
    phone: input.client.phone,
    createdById: input.actorId,
    updatedAt: new Date(),
  };
  const [client] = existing
    ? await db.update(clients).set(values).where(eq(clients.id, existing.id)).returning()
    : await db.insert(clients).values(values).returning();
  await audit({ actorId: input.actorId, action: existing ? "update" : "create", entity: "client", entityId: client.id, before: existing, after: client, request: input.request });
  return client;
}

export async function createStoreSale(input: {
  actorId: string;
  client?: Parameters<typeof getOrCreateClient>[0]["client"];
  paymentMethod: string;
  notes?: string;
  electronicInvoiceType?: "BOLETA" | "FACTURA";
  items: Array<{ productId: string; sku: string; description: string; quantity: number; unitPrice: number }>;
  request: Request;
}) {
  const client = await getOrCreateClient({ actorId: input.actorId, client: input.client, request: input.request });
  const productsById = new Map();
  for (const item of input.items) {
    const [product] = await db.select().from(products).where(eq(products.id, item.productId)).limit(1);
    if (!product) throw new Error(`Product not found: ${item.sku}`);
    const available = product.stockOnHand - product.stockReserved;
    if (available < item.quantity) throw new Error(`Stock insuficiente para ${product.sku}. Disponible: ${available}`);
    productsById.set(item.productId, product);
  }

  const totalAmount = input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const [rowCount] = await db.select({ value: count() }).from(sales);
  const code = `SALE-${String(rowCount.value + 1).padStart(6, "0")}`;
  const [sale] = await db.insert(sales).values({
    code,
    clientId: client.id,
    paymentMethod: input.paymentMethod,
    totalAmount: money(totalAmount),
    taxableAmount: money(totalAmount / 1.18),
    igvAmount: money(totalAmount - totalAmount / 1.18),
    notes: input.notes,
    electronicInvoiceType: input.electronicInvoiceType,
    electronicInvoiceStatus: input.electronicInvoiceType ? "READY" : "NOT_REQUIRED",
    customerDocumentType: client.documentType,
    customerDocumentNumber: client.documentId,
    customerLegalName: client.name,
    createdById: input.actorId,
  }).returning();

  for (const item of input.items) {
    const product = productsById.get(item.productId) as typeof products.$inferSelect;
    const subtotal = item.quantity * item.unitPrice;
    const [saleItem] = await db.insert(saleItems).values({
      saleId: sale.id,
      productId: product.id,
      sku: product.sku,
      description: item.description || product.description,
      quantity: item.quantity,
      unitPrice: money(item.unitPrice),
      subtotal: money(subtotal),
    }).returning();
    const [after] = await db.update(products).set({
      stockOnHand: product.stockOnHand - item.quantity,
      updatedAt: new Date(),
    }).where(eq(products.id, product.id)).returning();
    await recordStockMovement({
      productId: product.id,
      movementType: "OUT",
      sourceType: "STORE_SALE",
      sourceId: sale.id,
      quantity: item.quantity,
      previousStockOnHand: product.stockOnHand,
      newStockOnHand: after.stockOnHand,
      previousStockReserved: product.stockReserved,
      newStockReserved: after.stockReserved,
      reason: `Venta tienda ${sale.code}`,
      actorId: input.actorId,
    });
    await audit({ actorId: input.actorId, action: "update", entity: "stock", entityId: saleItem.id, after: { saleItem, product: after }, request: input.request });
  }

  await audit({ actorId: input.actorId, action: "create", entity: "sale", entityId: sale.id, after: sale, request: input.request });
  await publishOrderEvent(sale.id, "sale.created", sale);
  await publishOrderEvent(sale.id, "stock.updated", { sourceType: "STORE_SALE", sourceId: sale.id });
  await publishOrderEvent(sale.id, "kardex.created", { sourceType: "STORE_SALE", sourceId: sale.id });
  return sale;
}
