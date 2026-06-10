import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["admin", "promoter"]);
export const userStatusEnum = pgEnum("user_status", ["active", "inactive"]);
export const productStatusEnum = pgEnum("product_status", ["active", "inactive"]);
export const documentTypeEnum = pgEnum("document_type", ["DNI", "CEX", "GENERIC"]);
export const shippingProviderTypeEnum = pgEnum("shipping_provider_type", ["MOTORIZED", "COURIER"]);
export const orderStatusEnum = pgEnum("order_status", [
  "CREATED",
  "REGISTERED",
  "PAID",
  "PRODUCTS_INCOMPLETE",
  "PRODUCTS_COMPLETE",
  "PAYMENT_CONFIRMED",
  "SCHEDULED",
  "READY_TO_SHIP",
  "PACKAGING_PAID",
  "SHIPPED",
  "DELIVERED",
  "CLOSED",
  "OBSERVED",
  "CANCELLED",
]);
export const stockMovementTypeEnum = pgEnum("stock_movement_type", [
  "IN",
  "RESERVE",
  "RELEASE",
  "OUT",
  "ADJUSTMENT",
  "PENDING_PRODUCTION",
]);
export const stockSourceTypeEnum = pgEnum("stock_source_type", ["ORDER", "STORE_SALE", "MANUAL", "PRODUCTION"]);
export const saleChannelEnum = pgEnum("sale_channel", ["STORE"]);
export const evidenceTypeEnum = pgEnum("evidence_type", [
  "photo",
  "signature",
  "document",
  "note",
]);
export const auditActionEnum = pgEnum("audit_action", [
  "create",
  "update",
  "delete",
  "login",
  "logout",
  "change_password",
  "status_transition",
]);
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: userRoleEnum("role").notNull().default("promoter"),
    phone: text("phone"),
    status: userStatusEnum("status").notNull().default("active"),
    active: boolean("active").notNull().default(true),
    mustChangePassword: boolean("must_change_password").notNull().default(false),
    temporaryPasswordVisible: text("temporary_password_visible"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("users_email_idx").on(table.email)],
);

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    documentType: documentTypeEnum("document_type"),
    documentId: text("document_id"),
    email: text("email"),
    phone: text("phone"),
    address: text("address"),
    deliveryReference: text("delivery_reference"),
    ubigeo: text("ubigeo"),
    department: text("department"),
    province: text("province"),
    district: text("district"),
    city: text("city"),
    notes: text("notes"),
    active: boolean("active").notNull().default(true),
    createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("clients_name_idx").on(table.name)],
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sku: text("sku").notNull(),
    description: text("description").notNull(),
    defaultUnitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull().default("0"),
    basePrice: numeric("base_price", { precision: 12, scale: 2 }).notNull().default("0"),
    stockOnHand: integer("stock_on_hand").notNull().default(0),
    stockReserved: integer("stock_reserved").notNull().default(0),
    minStock: integer("min_stock").notNull().default(0),
    primaryImageUrl: text("primary_image_url"),
    status: productStatusEnum("status").notNull().default("active"),
    active: boolean("active").notNull().default(true),
    createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("products_sku_idx").on(table.sku)],
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: text("code").notNull(),
    clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "restrict" }),
    status: orderStatusEnum("status").notNull().default("REGISTERED"),
    orderDetails: text("order_details").notNull(),
    totalAmount: numeric("total_amount", { precision: 12, scale: 2 }),
    totalProductsAmount: numeric("total_products_amount", { precision: 12, scale: 2 }).notNull().default("0"),
    totalOrderAmount: numeric("total_order_amount", { precision: 12, scale: 2 }).notNull().default("0"),
    productPaymentAmount: numeric("product_payment_amount", { precision: 12, scale: 2 }),
    productPaymentMethod: text("product_payment_method"),
    productPaymentDate: timestamp("product_payment_date", { withTimezone: true }),
    productPaymentConfirmed: boolean("product_payment_confirmed").notNull().default(false),
    packagingCost: numeric("packaging_cost", { precision: 12, scale: 2 }).notNull().default("2.00"),
    packagingPaymentAmount: numeric("packaging_payment_amount", { precision: 12, scale: 2 }),
    packagingPaymentMethod: text("packaging_payment_method"),
    packagingPaymentDate: timestamp("packaging_payment_date", { withTimezone: true }),
    subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull().default("0"),
    tax: numeric("tax", { precision: 12, scale: 2 }).notNull().default("0"),
    total: numeric("total", { precision: 12, scale: 2 }).notNull().default("0"),
    shippingAddress: text("shipping_address"),
    deliveryReference: text("delivery_reference"),
    scheduledShippingAt: timestamp("scheduled_shipping_at", { withTimezone: true }),
    scheduledShippingDate: timestamp("scheduled_shipping_date", { withTimezone: true }),
    packagingPaymentConfirmed: boolean("packaging_payment_confirmed").notNull().default(false),
    packagingPaymentConfirmedById: uuid("packaging_payment_confirmed_by_id").references(() => users.id, { onDelete: "set null" }),
    packagingPaymentConfirmedAt: timestamp("packaging_payment_confirmed_at", { withTimezone: true }),
    packagedAt: timestamp("packaged_at", { withTimezone: true }),
    shippingProviderType: shippingProviderTypeEnum("shipping_provider_type"),
    shippingProviderName: text("shipping_provider_name"),
    shippingType: shippingProviderTypeEnum("shipping_type"),
    providerName: text("provider_name"),
    trackingNumber: text("tracking_number"),
    deliveryOrderNumber: text("delivery_order_number"),
    shippedAt: timestamp("shipped_at", { withTimezone: true }),
    customerReceivedConfirmed: boolean("customer_received_confirmed").notNull().default(false),
    customerPickupConfirmed: boolean("customer_pickup_confirmed").notNull().default(false),
    customerPickupConfirmedAt: timestamp("customer_pickup_confirmed_at", { withTimezone: true }),
    carrierDeliveredConfirmed: boolean("carrier_delivered_confirmed").notNull().default(false),
    hasMissingProducts: boolean("has_missing_products").notNull().default(false),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    deliveryDate: timestamp("delivery_date", { withTimezone: true }),
    notes: text("notes"),
    observations: text("observations"),
    createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),
    assignedToId: uuid("assigned_to_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("orders_code_idx").on(table.code),
    index("orders_client_idx").on(table.clientId),
    index("orders_status_idx").on(table.status),
  ],
);

export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
  sku: text("sku"),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
  total: numeric("total", { precision: 12, scale: 2 }).notNull(),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull().default("0"),
  reservedQuantity: integer("reserved_quantity").notNull().default(0),
  missingQuantity: integer("missing_quantity").notNull().default(0),
  fulfilledQuantity: integer("fulfilled_quantity").notNull().default(0),
  isComplete: boolean("is_complete").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sales = pgTable(
  "sales",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: text("code").notNull(),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
    channel: saleChannelEnum("channel").notNull().default("STORE"),
    saleDate: timestamp("sale_date", { withTimezone: true }).notNull().defaultNow(),
    paymentMethod: text("payment_method").notNull(),
    totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
    notes: text("notes"),
    electronicInvoiceStatus: text("electronic_invoice_status").notNull().default("PENDING"),
    electronicInvoiceType: text("electronic_invoice_type"),
    electronicInvoiceSeries: text("electronic_invoice_series"),
    electronicInvoiceNumber: text("electronic_invoice_number"),
    electronicInvoiceHash: text("electronic_invoice_hash"),
    customerDocumentType: text("customer_document_type"),
    customerDocumentNumber: text("customer_document_number"),
    customerLegalName: text("customer_legal_name"),
    taxableAmount: numeric("taxable_amount", { precision: 12, scale: 2 }),
    igvAmount: numeric("igv_amount", { precision: 12, scale: 2 }),
    createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("sales_code_idx").on(table.code)],
);

export const saleItems = pgTable("sale_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  saleId: uuid("sale_id").notNull().references(() => sales.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "restrict" }),
  sku: text("sku").notNull(),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const stockMovements = pgTable(
  "stock_movements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "restrict" }),
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
    orderItemId: uuid("order_item_id").references(() => orderItems.id, { onDelete: "set null" }),
    movementType: stockMovementTypeEnum("movement_type").notNull(),
    sourceType: stockSourceTypeEnum("source_type"),
    sourceId: text("source_id"),
    quantity: integer("quantity").notNull(),
    previousStockOnHand: integer("previous_stock_on_hand").notNull(),
    newStockOnHand: integer("new_stock_on_hand").notNull(),
    previousStockReserved: integer("previous_stock_reserved").notNull(),
    newStockReserved: integer("new_stock_reserved").notNull(),
    reason: text("reason"),
    createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("stock_movements_product_idx").on(table.productId),
    index("stock_movements_order_idx").on(table.orderId),
  ],
);

export const orderStatusHistory = pgTable(
  "order_status_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    fromStatus: orderStatusEnum("from_status"),
    toStatus: orderStatusEnum("to_status").notNull(),
    reason: text("reason"),
    createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("order_status_history_order_idx").on(table.orderId)],
);

export const shipments = pgTable(
  "shipments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    carrier: text("carrier"),
    trackingNumber: text("tracking_number"),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    shippedAt: timestamp("shipped_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    notes: text("notes"),
    createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("shipments_order_idx").on(table.orderId)],
);

export const orderEvidence = pgTable(
  "order_evidence",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    type: evidenceTypeEnum("type").notNull(),
    url: text("url").notNull(),
    description: text("description"),
    metadata: jsonb("metadata"),
    createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("order_evidence_order_idx").on(table.orderId)],
);

export const uploadedFiles = pgTable(
  "uploaded_files",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    scope: text("scope").notNull(),
    entityId: uuid("entity_id"),
    fileKey: text("file_key").notNull(),
    publicUrl: text("public_url").notNull(),
    contentType: text("content_type").notNull(),
    size: integer("size").notNull(),
    originalName: text("original_name").notNull(),
    uploadedById: uuid("uploaded_by_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("uploaded_files_key_idx").on(table.fileKey),
    index("uploaded_files_entity_idx").on(table.scope, table.entityId),
  ],
);

export type UploadedFile = typeof uploadedFiles.$inferSelect;

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    action: auditActionEnum("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id"),
    before: jsonb("before"),
    after: jsonb("after"),
    ip: text("ip"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("audit_entity_idx").on(table.entity, table.entityId)],
);

export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];
